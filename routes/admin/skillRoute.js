const express = require('express');
const router = express.Router();
const { verifyAllToken } = require("../../middleware/verifyToken");
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
router.post('/create', verifyAllToken(["labour", "contractor", "admin"]), createSkill);

// Get all skills with pagination and search
router.get('/skills', verifyAllToken(["labour", "contractor", "admin"]), getAllSkills);

// Get skill by ID
router.get('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), getSkillById);

// Update skill
router.put('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), updateSkill);

// Toggle skill status
router.patch('/skills/:id/toggle', verifyAllToken(["labour", "contractor", "admin"]), toggleSkillStatus);

// Delete single skill
router.delete('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), deleteSkill);

// Delete multiple skills
router.delete('/skills', verifyAllToken(["labour", "contractor", "admin"]), deleteMultipleSkills);

module.exports = router; 