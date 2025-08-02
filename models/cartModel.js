const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'Product',
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: [1, 'Quantity cannot be less than 1'],
    },
    price: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    image: { 
        type: String,
        required: true,
    },
});

const cartSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: false,
      ref: 'User',
    },
    items: [cartItemSchema],
    sessionId: {
      type: String,
      required: false,
    },
    createdAt: { 
      type: Date, 
      default: Date.now,
      expires: 60, 
    },
  }, 
);

cartSchema.index(
  { createdAt: 1 }, 
  { 
    expireAfterSeconds: 60,
    partialFilterExpression: { 
      userId: { $exists: false }, 
    },
  }
);

module.exports = mongoose.model('Cart', cartSchema);