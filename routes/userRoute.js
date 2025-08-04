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
    updateUserDetails,
    getContractorById,
    // verifyUserProfile
} = require('../controllers/userController');
const { verifyUser, verifyAdmin, verifyAllToken } = require("../middleware/verifyToken");
const { handleFileUpload } = require("../config/multerConfig");


const router = express.Router();

router.get('/get/:id', getUserById);
router.get('/contractor/:id', verifyAllToken(['contractor']), getContractorById);
router.patch('/update/:id', updateUserProfile);
router.patch('/update-location', verifyAllToken(['labour']), updateLocation);
router.post('/profile-image', verifyAllToken(['labour']), handleFileUpload, uploadProfileImage)


// admin routes
router.patch('/admin/update/:id', updateUserProfile);
router.get('/admin/get-all', verifyAllToken(['admin']), getAllUsers);
// router.patch('/admin/verify-user/:id', verifyAllToken(['admin']), verifyUserProfile);
router.put('/admin/update-user-details', verifyAllToken(['admin']), updateUserDetails);
router.delete('/admin/delete/:id', verifyAllToken(['admin']), deleteUser);
router.get('/admin/search-users', verifyAllToken(['admin']), searchUsers);
router.delete('/admin/multiple/delete', deleteMultipleUsers);


module.exports = router;
