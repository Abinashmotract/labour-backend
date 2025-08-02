const Review = require("../models/reviewModel");

// Add a review (user to stylist or stylist's service)
exports.addReview = async (req, res) => {
    try {
        const { entityType, reviewedId, ratings, description } = req.body;
        if (!entityType || !reviewedId || typeof ratings !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'entityType, reviewedId, and ratings are required',
            });
        }
        if (!['stylist', 'package', 'product'].includes(entityType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid entityType',
            });
        }
        // Find or create the review document for this entity type
        let reviewDoc = await Review.findOne({ entityType });
        if (!reviewDoc) {
            reviewDoc = new Review({ entityType, review: [] });
        }
        // Add the review
        reviewDoc.review.push({
            user: req.user.id,
            reviewed: reviewedId,
            ratings,
            description,
        });
        await reviewDoc.save();
        res.status(201).json({
            success: true,
            message: 'Review added successfully',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get reviews for a stylist or service
exports.getReviews = async (req, res) => {
    try {
        const { entityType, reviewedId } = req.query;
        if (!entityType || !reviewedId) {
            return res.status(400).json({
                success: false,
                message: 'entityType and reviewedId are required',
            });
        }
        const reviewDoc = await Review.findOne({ entityType });
        if (!reviewDoc) {
            return res.status(200).json({
                success: true,
                reviews: [],
            });
        }
        const reviews = reviewDoc.review.filter(r => r.reviewed.toString() === reviewedId && r.isVisible);
        res.status(200).json({
            success: true,
            reviews,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get all stylist reviews for admin
exports.getAllStylistReviews = async (req, res) => {
    try {
        const reviewDoc = await Review.findOne({ entityType: 'stylist' });
        let reviews = [];

        if (reviewDoc) {
            reviews = reviewDoc.review; // ✅ Return all reviews (not just visible ones)

            // Populate user name and profileImage
            const User = require('../models/userModel');
            const userIds = reviews.map(r => r.user);
            const users = await User.find({ _id: { $in: userIds } }).select('fullName profileImage');
            const userMap = {};
            users.forEach(u => { userMap[u._id.toString()] = u; });

            reviews = reviews.map(r => ({
                ...r.toObject(),
                userName: userMap[r.user.toString()]?.fullName || '',
                userProfileImage: userMap[r.user.toString()]?.profileImage || ''
            }));
        }

        // ✅ Optional log total count
        console.log("Total reviews fetched:", reviews.length);

        res.status(200).json({
            success: true,
            reviews
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Admin: Update review status to active/inactive
exports.updateReviewVisibility = async (req, res) => {
    try {
        const { reviewId, status } = req.body;
        if (!reviewId || !['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'reviewId and status (active/inactive) are required.'
            });
        }
        const isVisible = status === 'active';
        const result = await Review.findOneAndUpdate(
            { entityType: 'stylist', 'review._id': reviewId },
            { $set: { 'review.$.isVisible': isVisible } }
        );
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Review not found.'
            });
        }
        res.status(200).json({
            success: true,
            message: 'Review status updated successfully.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Admin: delete review 
exports.deleteReviews = async (req, res) => {
    try {
        const { reviewIds } = req.body; // Expect array of review IDs (even for one)

        if (!Array.isArray(reviewIds) || reviewIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: "reviewIds must be a non-empty array.",
            });
        }

        // Delete reviews from all Review documents that contain them
        const result = await Review.updateMany(
            {},
            {
                $pull: {
                    review: {
                        _id: { $in: reviewIds },
                    },
                },
            }
        );

        res.status(200).json({
            success: true,
            message: `Deleted ${reviewIds.length} review(s).`,
            modifiedCount: result.modifiedCount,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

