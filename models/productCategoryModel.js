const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productCategorySchema = mongoose.Schema(
  {
    name: {
        type: String,
        required: false,
    },
    isActive: {
        type: Boolean,
        default: false,
    },
    icon: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('ProductCategory', productCategorySchema);