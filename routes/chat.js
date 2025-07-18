const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/chat
// @desc    Create or get chat room
// @access  Private
router.post('/', [
  auth,
  body('participantId').isMongoId(),
  body('chatType').optional().isIn(['direct', 'booking', 'support'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { participantId, chatType = 'direct', bookingId } = req.body;

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, participantId] },
      chatType
    }).populate('participants', 'firstName lastName profileImage');

    if (!chat) {
      // Create new chat
      chat = new Chat({
        participants: [req.user._id, participantId],
        chatType,
        booking: bookingId
      });
      await chat.save();
      await chat.populate('participants', 'firstName lastName profileImage');
    }

    res.json(chat);
  } catch (error) {
    console.error('Create chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat
// @desc    Get user's chats
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isActive: true
    })
    .populate('participants', 'firstName lastName profileImage')
    .populate('booking', 'scheduledDate scheduledTime')
    .sort({ lastMessage: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/:id
// @desc    Get chat by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    })
    .populate('participants', 'firstName lastName profileImage')
    .populate('booking', 'scheduledDate scheduledTime service')
    .populate('messages.sender', 'firstName lastName profileImage');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Mark messages as read
    chat.markAsRead(req.user._id);
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/:id/messages
// @desc    Send message to chat
// @access  Private
router.post('/:id/messages', [
  auth,
  body('content').trim().notEmpty().isLength({ max: 2000 }),
  body('messageType').optional().isIn(['text', 'image', 'file', 'system'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, messageType = 'text' } = req.body;
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Add message to chat
    const message = chat.addMessage(req.user._id, content, messageType);
    await chat.save();

    // Populate sender info
    await chat.populate('messages.sender', 'firstName lastName profileImage');

    res.json({
      message: 'Message sent successfully',
      chat
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/support
// @desc    Create support chat with admin
// @access  Private
router.post('/support', [
  auth,
  body('message').trim().notEmpty().isLength({ max: 2000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message } = req.body;

    // Find admin user
    const admin = await require('../models/User').findOne({ role: 'admin', isActive: true });
    if (!admin) {
      return res.status(404).json({ message: 'No admin available' });
    }

    // Check if support chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user._id, admin._id] },
      chatType: 'support'
    });

    if (!chat) {
      // Create new support chat
      chat = new Chat({
        participants: [req.user._id, admin._id],
        chatType: 'support'
      });
    }

    // Add initial message
    chat.addMessage(req.user._id, message);
    await chat.save();

    await chat.populate('participants', 'firstName lastName profileImage');

    res.json({
      message: 'Support chat created successfully',
      chat
    });
  } catch (error) {
    console.error('Create support chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/bot
// @desc    Handle chatbot messages
// @access  Public
router.post('/bot', [
  body('message').trim().notEmpty(),
  body('sessionId').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { message, sessionId } = req.body;

    // Simple chatbot responses
    const responses = {
      greeting: [
        'Hello! Welcome to FixLink. How can I help you today?',
        'Hi there! I\'m here to help you find the perfect service provider.',
        'Welcome to FixLink! What service do you need today?'
      ],
      services: [
        'We offer various services including plumbing, electrical, cleaning, gardening, painting, and carpentry.',
        'Our providers offer professional services in multiple categories. What type of service are you looking for?',
        'We have skilled providers for plumbing, electrical work, cleaning, gardening, painting, and carpentry services.'
      ],
      booking: [
        'To book a service, you\'ll need to create an account and browse our available providers.',
        'Booking is easy! Just sign up, find a provider, and schedule your service.',
        'You can book services by creating an account and selecting from our verified providers.'
      ],
      pricing: [
        'Pricing varies by service type and provider. Each provider sets their own rates.',
        'Our providers offer competitive pricing. You can view rates when browsing services.',
        'Prices depend on the service and provider. Check individual service listings for rates.'
      ],
      support: [
        'For support, please create an account and use our in-app chat feature.',
        'You can contact our support team through the chat feature after signing up.',
        'We\'re here to help! Use our chat feature for personalized support.'
      ]
    };

    // Simple keyword matching
    const userMessage = message.toLowerCase();
    let response = 'I\'m not sure how to help with that. Could you please rephrase your question?';

    if (userMessage.includes('hello') || userMessage.includes('hi') || userMessage.includes('hey')) {
      response = responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    } else if (userMessage.includes('service') || userMessage.includes('what') || userMessage.includes('offer')) {
      response = responses.services[Math.floor(Math.random() * responses.services.length)];
    } else if (userMessage.includes('book') || userMessage.includes('schedule') || userMessage.includes('appointment')) {
      response = responses.booking[Math.floor(Math.random() * responses.booking.length)];
    } else if (userMessage.includes('price') || userMessage.includes('cost') || userMessage.includes('rate')) {
      response = responses.pricing[Math.floor(Math.random() * responses.pricing.length)];
    } else if (userMessage.includes('help') || userMessage.includes('support') || userMessage.includes('contact')) {
      response = responses.support[Math.floor(Math.random() * responses.support.length)];
    }

    res.json({
      message: response,
      sessionId: sessionId || Date.now().toString()
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/:id/read
// @desc    Mark chat messages as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      participants: req.user._id
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    chat.markAsRead(req.user._id);
    await chat.save();

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 