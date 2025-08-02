const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const packageSchema = mongoose.Schema(
    {
        stylist: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stylist"
        },
        title: {
            type: String,
            required: false,
        },
        about: {
            type: String,
            default: false,
        },
        serviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Service"
        },
        subService: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubService"
        }],
        date: [{
            type: Date
        }],
        price: {
            type: Number
        },
        duration: {
            type: Number
        },
        availableDates: {
            type: Date
        },
        coverImage: {
            type: String
        },
        discount: {
            type: Number
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Package', packageSchema);