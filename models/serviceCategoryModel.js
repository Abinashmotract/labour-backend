const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const serviceCategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    minPrice: {
      type: Number,
    },
    maxPrice: {
      type: Number
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

// serviceCategorySchema.index({ location: "2dsphere" }); // Creates a geospatial index

module.exports = mongoose.model('Service', serviceCategorySchema);