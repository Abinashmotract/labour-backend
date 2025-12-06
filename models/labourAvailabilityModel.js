const mongoose = require('mongoose');

const labourAvailabilitySchema = new mongoose.Schema({
  labour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true
  },
  availabilityDate: {
    type: Date,
    required: true
  },
  availabilityType: {
    type: String,
    enum: ['specific_date'],
    default: 'specific_date'
  },
  skills: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    },
    address: {
      type: String,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  matchedJobs: [{
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobPost'
    },
    contractor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for performance
labourAvailabilitySchema.index({ labour: 1, availabilityDate: 1 });
labourAvailabilitySchema.index({ availabilityDate: 1, status: 1 });
labourAvailabilitySchema.index({ location: "2dsphere" });
labourAvailabilitySchema.index({ skills: 1 });

module.exports = mongoose.model('LabourAvailability', labourAvailabilitySchema);
