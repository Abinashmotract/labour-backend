const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  token: { type: String },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  responseId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema); 