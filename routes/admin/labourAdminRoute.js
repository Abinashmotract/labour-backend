const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../../middleware/verifyToken');
const {
    getAllLabour,
    getLabourById,
    deleteLabour,
    deleteMultipleLabour,
    getLabourStats
} = require('../../controllers/admin/labourAdminController');

// Get all labour with pagination and search
router.get('/labour', verifyAdmin, getAllLabour);

// Get labour by ID
router.get('/labour/:id', verifyAdmin, getLabourById);

// Delete single labour
router.delete('/labour/:id', verifyAdmin, deleteLabour);

// Delete multiple labour
router.delete('/labour', verifyAdmin, deleteMultipleLabour);

// Get labour statistics
router.get('/labour/stats/overview', verifyAdmin, getLabourStats);

module.exports = router; 