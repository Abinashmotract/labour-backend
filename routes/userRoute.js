const express = require("express");
const { uploadToLocal } = require("../config/multerLocal");
const {
    getAllUsers,
    toggleContractorAgent,
    getLabourDetailsById,
    getAllLabours,
    searchAllLabours,
    getLoggedInUser,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage,
    updateRoleBasisUser,
    getLaboursByAgent,
    deleteLabourAccount,
} = require('../controllers/userController');
const { verifyUser, verifyAdmin, verifyAllToken } = require("../middleware/verifyToken");


const router = express.Router();

router.get('/me', verifyAllToken(['labour', 'contractor']), getLoggedInUser);
router.patch('/update-location', verifyAllToken(['labour']), updateLocation);
router.post('/profile-image', verifyAllToken(['labour', 'contractor']), uploadToLocal, uploadProfileImage);

router.delete('/delete-account', verifyAllToken(['labour']), deleteLabourAccount);

router.get('/labour-details', verifyAllToken(['labour']), getLabourDetailsById);

// admin routes
router.put('/role/update-user-details', verifyAllToken(['labour', 'contractor']), uploadToLocal, updateRoleBasisUser);
router.get('/admin/get-all', verifyAllToken(['admin', 'labour']), getAllUsers);
router.put("/admin/contractor/:id/toggle-agent", verifyAllToken(["admin"]), toggleContractorAgent);
router.get('/contractor/all-labour', verifyAllToken(['contractor']), getAllLabours);
router.get('/contractor/search-labour', verifyAllToken(['contractor']), searchAllLabours);
router.delete('/admin/delete/:id', verifyAllToken(['admin']), deleteUser);
router.get('/admin/search-users', verifyAllToken(['admin']), searchUsers);
router.delete('/admin/multiple/delete', deleteMultipleUsers);

router.get("/agent/:agentId/labours", getLaboursByAgent);



module.exports = router;
