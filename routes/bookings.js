const express = require('express');
const { body, validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Service = require('../models/Service');
const User = require('../models/User');
const { auth, customerOnly, providerOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/bookings
// @desc    Create a new booking (customer only)
// @access  Private
router.post('/', [
  auth,
  customerOnly,
  body('serviceId').isMongoId(),
  body('scheduledDate').isISO8601(),
  body('scheduledTime').notEmpty(),
  body('duration').isFloat({ min: 0.5, max: 24 }),
  body('location.address').notEmpty(),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('specialInstructions').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      serviceId,
      scheduledDate,
      scheduledTime,
      duration,
      location,
      description,
      specialInstructions
    } = req.body;

    // Check if service exists and is active
    const service = await Service.findById(serviceId).populate('provider');
    if (!service || !service.isActive) {
      return res.status(404).json({ message: 'Service not found or inactive' });
    }

    // Check if provider is active
    if (!service.provider.isActive) {
      return res.status(400).json({ message: 'Provider is not available' });
    }

    // Check if booking date is in the future
    const bookingDate = new Date(scheduledDate);
    if (bookingDate <= new Date()) {
      return res.status(400).json({ message: 'Booking date must be in the future' });
    }

    // Calculate total amount
    const totalAmount = service.price * duration;

    const booking = new Booking({
      customer: req.user._id,
      provider: service.provider._id,
      service: serviceId,
      scheduledDate: bookingDate,
      scheduledTime,
      duration,
      totalAmount,
      location,
      description,
      specialInstructions
    });

    await booking.save();

    // Populate the booking with service and provider details
    await booking.populate([
      { path: 'service', select: 'name category price' },
      { path: 'provider', select: 'firstName lastName phone' },
      { path: 'customer', select: 'firstName lastName phone' }
    ]);

    res.status(201).json({
      message: 'Booking created successfully',
      booking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings
// @desc    Get user's bookings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    // Filter by user role
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      filter.provider = req.user._id;
    }

    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('service', 'name category price')
      .populate('provider', 'firstName lastName phone profileImage')
      .populate('customer', 'firstName lastName phone')
      .sort({ scheduledDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Booking.countDocuments(filter);

    res.json({
      bookings,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/:id
// @desc    Get booking by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('service', 'name category price description')
      .populate('provider', 'firstName lastName phone profileImage')
      .populate('customer', 'firstName lastName phone');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user has access to this booking
    if (req.user.role !== 'admin' && 
        booking.customer._id.toString() !== req.user._id.toString() &&
        booking.provider._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this booking' });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', [
  auth,
  body('status').isIn(['confirmed', 'in-progress', 'completed', 'cancelled', 'rejected']),
  body('cancellationReason').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, cancellationReason } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    const isCustomer = booking.customer.toString() === req.user._id.toString();
    const isProvider = booking.provider.toString() === req.user._id.toString();

    if (!isCustomer && !isProvider && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'cancelled', 'rejected'],
      confirmed: ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      rejected: []
    };

    if (!validTransitions[booking.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${booking.status} to ${status}` 
      });
    }

    // Update booking
    booking.status = status;
    if (status === 'cancelled' || status === 'rejected') {
      booking.cancelledBy = isCustomer ? 'customer' : 'provider';
      if (cancellationReason) {
        booking.cancellationReason = cancellationReason;
      }
    }

    await booking.save();

    // Populate the updated booking
    await booking.populate([
      { path: 'service', select: 'name category price' },
      { path: 'provider', select: 'firstName lastName phone' },
      { path: 'customer', select: 'firstName lastName phone' }
    ]);

    res.json({
      message: 'Booking status updated successfully',
      booking
    });
  } catch (error) {
    console.error('Update booking status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/bookings/:id/review
// @desc    Add review to completed booking (customer only)
// @access  Private
router.post('/:id/review', [
  auth,
  customerOnly,
  body('rating').isInt({ min: 1, max: 5 }),
  body('review').optional().trim().isLength({ max: 1000 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rating, review } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if user owns this booking
    if (booking.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to review this booking' });
    }

    // Check if booking is completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed bookings' });
    }

    // Check if already reviewed
    if (booking.rating) {
      return res.status(400).json({ message: 'Booking already reviewed' });
    }

    // Update booking with review
    booking.rating = rating;
    booking.review = review;
    booking.reviewDate = new Date();
    await booking.save();

    // Update provider's average rating
    const providerBookings = await Booking.find({
      provider: booking.provider,
      rating: { $exists: true }
    });

    const totalRating = providerBookings.reduce((sum, b) => sum + b.rating, 0);
    const averageRating = totalRating / providerBookings.length;

    await User.findByIdAndUpdate(booking.provider, {
      rating: averageRating,
      totalReviews: providerBookings.length
    });

    // Update service rating
    const serviceBookings = await Booking.find({
      service: booking.service,
      rating: { $exists: true }
    });

    const serviceTotalRating = serviceBookings.reduce((sum, b) => sum + b.rating, 0);
    const serviceAverageRating = serviceTotalRating / serviceBookings.length;

    await Service.findByIdAndUpdate(booking.service, {
      rating: serviceAverageRating,
      totalReviews: serviceBookings.length
    });

    res.json({
      message: 'Review added successfully',
      booking
    });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/bookings/stats
// @desc    Get booking statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const filter = {};
    
    if (req.user.role === 'customer') {
      filter.customer = req.user._id;
    } else if (req.user.role === 'provider') {
      filter.provider = req.user._id;
    }

    const stats = await Booking.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments(filter);
    const completedBookings = await Booking.countDocuments({ ...filter, status: 'completed' });

    res.json({
      stats,
      totalBookings,
      completedBookings,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0
    });
  } catch (error) {
    console.error('Get booking stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 