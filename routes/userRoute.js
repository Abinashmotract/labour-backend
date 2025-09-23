const express = require("express");
const {
    getAllUsers,
    toggleContractorAgent,
    getLabourDetailsById,
    getAllLabours,
    getLoggedInUser,
    updateUserProfile,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage,
    updateRoleBasisUser,
    getLaboursByAgent,
} = require('../controllers/userController');
const { verifyUser, verifyAdmin, verifyAllToken } = require("../middleware/verifyToken");


const router = express.Router();

router.get('/me', verifyAllToken(['labour', 'contractor']), getLoggedInUser);
router.patch('/update/:id', updateUserProfile);
router.patch('/update-location', verifyAllToken(['labour']), updateLocation);
router.post('/profile-image', verifyAllToken(['labour']), uploadProfileImage);

router.get('/labour-details', verifyAllToken(['labour']), getLabourDetailsById);

// admin routes
router.put('/role/update-user-details', verifyAllToken(['labour', 'contractor']), updateRoleBasisUser);
router.patch('/admin/update/:id', updateUserProfile);
router.get('/admin/get-all', verifyAllToken(['admin', 'labour']), getAllUsers);
router.put("/admin/contractor/:id/toggle-agent", verifyAllToken(["admin"]), toggleContractorAgent);
router.get('/contractor/all-labour', verifyAllToken(['contractor']), getAllLabours);
router.delete('/admin/delete/:id', verifyAllToken(['admin']), deleteUser);
router.get('/admin/search-users', verifyAllToken(['admin']), searchUsers);
router.delete('/admin/multiple/delete', deleteMultipleUsers);

router.get("/agent/:agentId/labours", getLaboursByAgent);



module.exports = router;
