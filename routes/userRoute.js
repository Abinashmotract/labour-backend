const express = require("express");
const {
    getAllUsers,
    getUserById,
    updateUserProfile,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage,
    appointmentManagement,
    getAppointmentBookings,
    updateUserDetails,
    // verifyUserProfile
} = require('../controllers/userController');
const { verifyUser, verifyAdmin, verifyAllToken } = require("../middleware/verifyToken");
const reviewController = require('../controllers/reviewController');


const router = express.Router();

router.get('/get/:id', getUserById);
router.patch('/update/:id', updateUserProfile);
router.patch('/update-location', verifyAllToken(['user']), updateLocation);
router.post('/profile-image', verifyAllToken(['user']), uploadProfileImage)
router.post('/book-appointment', verifyAllToken(['user']), appointmentManagement);
router.get('/appointments', verifyAllToken(['user']), getAppointmentBookings);

// Review APIs
router.post('/review', verifyAllToken(['user']), reviewController.addReview);
router.get('/reviews', verifyAllToken(['user', 'stylist']), reviewController.getReviews);

// admin routes
router.patch('/admin/update/:id', updateUserProfile);
router.get('/admin/get-all', verifyAllToken(['admin']), getAllUsers);
// router.patch('/admin/verify-user/:id', verifyAllToken(['admin']), verifyUserProfile);
router.put('/admin/update-user-details', verifyAllToken(['admin']), updateUserDetails);
router.delete('/admin/delete/:id', verifyAllToken(['admin']), deleteUser);
router.get('/admin/search-users', verifyAllToken(['admin']), searchUsers);
router.delete('/admin/multiple/delete', deleteMultipleUsers);
router.get('/admin/stylist-reviews', verifyAllToken(['admin']), reviewController.getAllStylistReviews);
router.patch('/admin/review-visibility', verifyAllToken(['admin']), reviewController.updateReviewVisibility);
router.delete('/admin/stylist-reviews', verifyAllToken(['admin', 'stylist']), reviewController.deleteReviews);

module.exports = router;
