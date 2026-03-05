const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [1, 'Name must be at least 1 character long']
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
    default: null // Optional - user can join family later
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
userSchema.index({ familyId: 1 });

module.exports = mongoose.model('User', userSchema);
