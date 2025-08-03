const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../../middleware/verifyToken');
const {
    getAllContractors,
    getContractorById,
    updateContractorApproval,
    deleteContractor,
    deleteMultipleContractors,
    getContractorStats
} = require('../../controllers/admin/contractorAdminController');

// Get all contractors with pagination and search
router.get('/contractors', verifyAdmin, getAllContractors);

// Get contractor by ID
router.get('/contractors/:id', verifyAdmin, getContractorById);

// Approve/Disapprove contractor
router.patch('/contractors/:id/approval', verifyAdmin, updateContractorApproval);

// Delete single contractor
router.delete('/contractors/:id', verifyAdmin, deleteContractor);

// Delete multiple contractors
router.delete('/contractors', verifyAdmin, deleteMultipleContractors);

// Get contractor statistics
router.get('/contractors/stats/overview', verifyAdmin, getContractorStats);

module.exports = router; 