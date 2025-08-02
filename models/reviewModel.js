const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new mongoose.Schema(
    {
        entityType: {
            type: String,
            enum: ["stylist", "product", "package"],
            required: true
        },
        review: [
            {
                user: {
                    type: Schema.Types.ObjectId,
                    required: true,
                    ref: "User"
                },
                reviewed: {
                    type: Schema.Types.ObjectId,
                    required: true,
                    ref: "Stylist"
                },
                ratings: {
                    type: Number,
                    min: 0,
                    max: 5
                },
                description: {
                    type: String
                },
                isVisible: {
                    type: Boolean,
                    default: true
                },
                createdAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ]
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Review', reviewSchema);
