const express = require('express');
const { body, validationResult } = require('express-validator');
const Service = require('../models/Service');
const User = require('../models/User');
const { auth, providerOnly, adminOnly } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/services
// @desc    Create a new service (provider only)
// @access  Private
router.post('/', [
  auth,
  providerOnly,
  body('name').trim().notEmpty(),
  body('category').isIn(['plumbing', 'electrical', 'cleaning', 'gardening', 'painting', 'carpentry', 'other']),
  body('description').trim().notEmpty().isLength({ max: 1000 }),
  body('price').isFloat({ min: 0 }),
  body('priceType').isIn(['hourly', 'fixed', 'daily']),
  body('location.coordinates').isArray({ min: 2, max: 2 }),
  body('serviceArea').optional().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const serviceData = {
      ...req.body,
      provider: req.user._id
    };

    const service = new Service(serviceData);
    await service.save();

    // Add service to provider's services array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { services: service._id } }
    );

    res.status(201).json({
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services
// @desc    Get all services with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search,
      category,
      minPrice,
      maxPrice,
      rating,
      location,
      page = 1,
      limit = 10
    } = req.query;

    const filter = { isActive: true };

    // Add search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (rating) filter.rating = { $gte: parseFloat(rating) };

    // Add location-based filtering if coordinates provided
    if (location) {
      try {
        const [lng, lat] = location.split(',').map(Number);
        if (!isNaN(lng) && !isNaN(lat)) {
          filter.location = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: 50000 // 50km
            }
          };
        }
      } catch (error) {
        console.error('Invalid location format:', error);
      }
    }

    let query = Service.find(filter)
      .populate('provider', 'firstName lastName rating totalReviews profileImage')
      .sort({ rating: -1, totalReviews: -1 });

    const services = await query
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Service.countDocuments(filter);

    res.json({
      services,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/:id
// @desc    Get service by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id)
      .populate('provider', 'firstName lastName bio rating totalReviews profileImage phone');

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/services/:id
// @desc    Update service (provider only)
// @access  Private
router.put('/:id', [
  auth,
  providerOnly,
  body('name').optional().trim().notEmpty(),
  body('category').optional().isIn(['plumbing', 'electrical', 'cleaning', 'gardening', 'painting', 'carpentry', 'other']),
  body('description').optional().trim().notEmpty().isLength({ max: 1000 }),
  body('price').optional().isFloat({ min: 0 }),
  body('priceType').optional().isIn(['hourly', 'fixed', 'daily'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('provider', 'firstName lastName');

    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/services/:id
// @desc    Delete service (provider only)
// @access  Private
router.delete('/:id', auth, providerOnly, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Check if user owns this service
    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this service' });
    }

    await Service.findByIdAndDelete(req.params.id);

    // Remove service from provider's services array
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { services: req.params.id } }
    );

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/provider/:providerId
// @desc    Get services by provider
// @access  Public
router.get('/provider/:providerId', async (req, res) => {
  try {
    const services = await Service.find({
      provider: req.params.providerId,
      isActive: true
    }).populate('provider', 'firstName lastName rating totalReviews');

    res.json(services);
  } catch (error) {
    console.error('Get provider services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/my-services
// @desc    Get current provider's services
// @access  Private
router.get('/my-services', auth, providerOnly, async (req, res) => {
  try {
    const services = await Service.find({
      provider: req.user._id
    }).sort({ createdAt: -1 });

    res.json(services);
  } catch (error) {
    console.error('Get my services error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/services/:id/status
// @desc    Toggle service active status (provider only)
// @access  Private
router.put('/:id/status', [
  auth,
  providerOnly,
  body('isActive').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const service = await Service.findById(req.params.id);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (service.provider.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this service' });
    }

    service.isActive = req.body.isActive;
    await service.save();

    res.json({
      message: `Service ${req.body.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    console.error('Toggle service status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/services/categories
// @desc    Get all service categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await Service.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 