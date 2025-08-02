const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: false
        },
        subtitle: {
            type: String,
            required: false,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ProductCategory"
        },
        about: {
            type: String,
            required: false
        },
        price: {
            type: Number,
            required: false
        },
        stockQuantity: {
            type: Number,
            required: false,
            default: 1
        },
        inStock: {
            type: Boolean,
            default: true
        },
        photos: [{
            type: String,
            required: false
        }],
        goodToKnow: [{
            type: String
        }],
        quickTips: {
            type: String
        },
        manufacturer: {
            name: String,
            address: String,
            contact: String
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Product', productSchema);