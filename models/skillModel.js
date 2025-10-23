const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    lowercase: true
  },
  nameHindi: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    // required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // includes createdAt and updatedAt automatically
});

// Indexes for performance
skillSchema.index({ name: 1 });
skillSchema.index({ isActive: 1 });

module.exports = mongoose.model('Skill', skillSchema);