const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  scheduledDate: {
    type: Date,
    required: true
  },
  scheduledTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  description: {
    type: String,
    maxlength: 1000
  },
  specialInstructions: {
    type: String,
    maxlength: 500
  },
  // Payment information
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash', 'bank_transfer'],
    default: 'card'
  },
  // Cancellation
  cancelledBy: {
    type: String,
    enum: ['customer', 'provider', 'admin']
  },
  cancellationReason: {
    type: String,
    maxlength: 500
  },
  // Rating and review
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    maxlength: 1000
  },
  reviewDate: {
    type: Date
  },
  // Provider response
  providerResponse: {
    type: String,
    maxlength: 1000
  },
  providerResponseDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ customer: 1, status: 1 });
bookingSchema.index({ provider: 1, status: 1 });
bookingSchema.index({ scheduledDate: 1, status: 1 });

// Virtual for formatted date
bookingSchema.virtual('formattedDate').get(function() {
  return this.scheduledDate.toLocaleDateString();
});

// Virtual for formatted time
bookingSchema.virtual('formattedTime').get(function() {
  return this.scheduledTime;
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const bookingDate = new Date(this.scheduledDate);
  const hoursDiff = (bookingDate - now) / (1000 * 60 * 60);
  
  return this.status === 'pending' || this.status === 'confirmed' && hoursDiff > 24;
};

// Method to calculate total amount
bookingSchema.methods.calculateTotal = function() {
  return this.totalAmount;
};

module.exports = mongoose.model('Booking', bookingSchema); 