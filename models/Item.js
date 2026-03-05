const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    minlength: [1, 'Item name must be at least 1 character long']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity cannot be negative']
  },
  expirationDate: {
    type: Date,
    default: null
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    required: [true, 'Family ID is required']
  },
  owners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingOwners: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Indexes for faster queries
itemSchema.index({ familyId: 1 });
itemSchema.index({ expirationDate: 1 }); // Useful for finding expiring items

// Virtual to check if item is expired
itemSchema.virtual('isExpired').get(function() {
  if (!this.expirationDate) return false;
  return this.expirationDate < new Date();
});

// Ensure virtuals are included in JSON output
itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Item', itemSchema);
