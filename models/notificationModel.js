const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  body: { 
    type: String, 
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['JOB_POST', 'JOB_APPLICATION', 'JOB_ACCEPTED', 'JOB_REJECTED', 'JOB_COMPLETED', 'PAYMENT', 'SYSTEM', 'NEARBY_JOB'],
    required: true
  },
  recipient: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'labour',
    required: true
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'labour'
  },
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobPost'
  },
  jobApplication: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'JobApplication'
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  fcmToken: { 
    type: String 
  },
  responseId: { 
    type: String 
  },
  sentAt: { 
    type: Date 
  },
  readAt: { 
    type: Date 
  }
}, {
  timestamps: true
});

// Indexes for better performance
NotificationSchema.index({ recipient: 1, isDeleted: 1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ type: 1 });
NotificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema); 