const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth, authorize, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('services', 'name category price');
    
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  auth,
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim(),
  body('bio').optional().trim().isLength({ max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { firstName, lastName, phone, bio, address } = req.body;
    const updateFields = {};

    if (firstName) updateFields.firstName = firstName;
    if (lastName) updateFields.lastName = lastName;
    if (phone) updateFields.phone = phone;
    if (bio) updateFields.bio = bio;
    if (address) updateFields.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/providers
// @desc    Get all providers
// @access  Public
router.get('/providers', async (req, res) => {
  try {
    const { category, rating, location } = req.query;
    const filter = { role: 'provider', isActive: true };

    if (category) {
      filter['services.category'] = category;
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    const providers = await User.find(filter)
      .select('firstName lastName bio rating totalReviews profileImage services')
      .populate('services', 'name category price description');

    res.json(providers);
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/providers/:id
// @desc    Get provider by ID
// @access  Public
router.get('/providers/:id', async (req, res) => {
  try {
    const provider = await User.findOne({
      _id: req.params.id,
      role: 'provider',
      isActive: true
    })
    .select('-password')
    .populate('services', 'name category price description images rating');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(provider);
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private/Admin
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/users/:id/status
// @desc    Update user status (admin only)
// @access  Private/Admin
router.put('/:id/status', [
  auth,
  adminOnly,
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/users/favorites/:providerId
// @desc    Add provider to favorites (customer only)
// @access  Private
router.post('/favorites/:providerId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can add favorites' });
    }

    const provider = await User.findOne({
      _id: req.params.providerId,
      role: 'provider',
      isActive: true
    });

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const user = await User.findById(req.user._id);
    
    if (user.favoriteProviders.includes(req.params.providerId)) {
      return res.status(400).json({ message: 'Provider already in favorites' });
    }

    user.favoriteProviders.push(req.params.providerId);
    await user.save();

    res.json({ message: 'Provider added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/users/favorites/:providerId
// @desc    Remove provider from favorites (customer only)
// @access  Private
router.delete('/favorites/:providerId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can remove favorites' });
    }

    const user = await User.findById(req.user._id);
    user.favoriteProviders = user.favoriteProviders.filter(
      id => id.toString() !== req.params.providerId
    );
    await user.save();

    res.json({ message: 'Provider removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/users/favorites
// @desc    Get user favorites (customer only)
// @access  Private
router.get('/favorites', auth, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ message: 'Only customers can view favorites' });
    }

    const user = await User.findById(req.user._id)
      .populate('favoriteProviders', 'firstName lastName bio rating totalReviews profileImage');

    res.json(user.favoriteProviders);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 