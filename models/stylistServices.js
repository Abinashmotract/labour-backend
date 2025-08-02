const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ServiceSchema = new mongoose.Schema({
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: false
    },
    subService: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubService',
        required: false
    },
    price: {
        type: Number,
        required: false,
        min: 0
    },
    duration: {
        type: Number,
        required: false
    },
    coupons: [{
        details: {
            code: {
                type: String,
                required: false
            },
            discount: {
                type: Number,
                required: false,
                min: 0
            },
            validUntil: {
                type: Date,
                required: false
            }
        },
        isVerified: {
            type: Boolean,
            default: false
        }
    }],
    isActive: {
        type: Boolean,
        default: false
    }
}, { _id: false }); // No need for separate IDs for expertise entries

module.exports = ServiceSchema;