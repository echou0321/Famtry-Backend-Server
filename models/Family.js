const mongoose = require('mongoose');

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Family name is required'],
    trim: true,
    minlength: [1, 'Family name must be at least 1 character long']
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
familySchema.index({ name: 1 });

module.exports = mongoose.model('Family', familySchema);
