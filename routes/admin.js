const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');

const router = express.Router();

// Middleware to check admin role
const requireAdmin = [auth, async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}];

// GET /api/admin/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const totalRevenue = await Booking.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    res.json({
      totalUsers,
      totalServices,
      totalBookings,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/users
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// PUT /api/admin/users/:id/status
router.put('/users/:id/status', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update user status' });
  }
});

// GET /api/admin/services
router.get('/services', requireAdmin, async (req, res) => {
  try {
    const services = await Service.find();
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch services' });
  }
});

// PUT /api/admin/services/:id/status
router.put('/services/:id/status', requireAdmin, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { isActive: req.body.isActive },
      { new: true }
    );
    res.json(service);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update service status' });
  }
});

// GET /api/admin/bookings
router.get('/bookings', requireAdmin, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('customer', 'firstName lastName email')
      .populate('provider', 'firstName lastName email')
      .populate('service', 'name');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router; 