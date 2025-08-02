const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SlotSchema = new Schema({
  from: {
    type: String, // 'HH:MM' 24-hour format
    required: true
  },
  till: {
    type: String, // 'HH:MM' 24-hour format
    required: true
  }
}, { _id: false });

const AvailabilitySchema = new Schema({
  stylistId: {
    type: Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  slots: {
    type: [SlotSchema],
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('StylistAvailability', AvailabilitySchema); 