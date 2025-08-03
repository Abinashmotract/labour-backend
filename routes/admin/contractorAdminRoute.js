const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../../middleware/verifyToken');
const {
    getAllContractors,
    getAllContractorsSimple,
    getContractorById,
    updateContractorApproval,
    deleteContractor,
    deleteMultipleContractors,
    getContractorStats,
    activateContractor,
    deactivateContractor,
    updateContractorStatus
} = require('../../controllers/admin/contractorAdminController');

// Get all contractors with pagination and search
router.get('/contractors', verifyAdmin, getAllContractors);

// Get all contractors (simple version without pagination)
router.get('/contractors/all', verifyAdmin, getAllContractorsSimple);

// Get contractor by ID
router.get('/contractors/:id', verifyAdmin, getContractorById);

// Approve/Disapprove contractor
router.patch('/contractors/:id/approval', verifyAdmin, updateContractorApproval);

// Update contractor status (for frontend compatibility)
router.patch('/contractors/:id', verifyAdmin, updateContractorStatus);

// Activate contractor
router.patch('/contractors/:id/activate', verifyAdmin, activateContractor);

// Deactivate contractor
router.patch('/contractors/:id/deactivate', verifyAdmin, deactivateContractor);

// Delete single contractor
router.delete('/contractors/:id', verifyAdmin, deleteContractor);

// Delete multiple contractors
router.delete('/contractors', verifyAdmin, deleteMultipleContractors);

// Get contractor statistics
router.get('/contractors/stats/overview', verifyAdmin, getContractorStats);

module.exports = router; 