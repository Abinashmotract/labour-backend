const express = require('express');
const router = express.Router();
const { verifyAdmin } = require('../../middleware/verifyToken');
const {
    createSkill,
    getAllSkills,
    getSkillById,
    updateSkill,
    deleteSkill,
    deleteMultipleSkills,
    toggleSkillStatus
} = require('../../controllers/admin/skillController');

// Create skill
router.post('/create', verifyAdmin, createSkill);

// Get all skills with pagination and search
router.get('/skills', verifyAdmin, getAllSkills);

// Get skill by ID
router.get('/skills/:id', verifyAdmin, getSkillById);

// Update skill
router.put('/skills/:id', verifyAdmin, updateSkill);

// Toggle skill status
router.patch('/skills/:id/toggle', verifyAdmin, toggleSkillStatus);

// Delete single skill
router.delete('/skills/:id', verifyAdmin, deleteSkill);

// Delete multiple skills
router.delete('/skills', verifyAdmin, deleteMultipleSkills);

module.exports = router; 