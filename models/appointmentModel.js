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

const AppointmentSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stylist: {
    type: Schema.Types.ObjectId,
    ref: 'Stylist',
    required: true
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  subService: {
    type: Schema.Types.ObjectId,
    ref: 'SubService',
    required: false
  },
  date: {
    type: String, // 'YYYY-MM-DD'
    required: true
  },
  slot: {
    type: SlotSchema,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  notes: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', AppointmentSchema); 