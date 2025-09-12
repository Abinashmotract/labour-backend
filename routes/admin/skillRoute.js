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

// skill
router.post('/create', verifyAllToken(["labour", "contractor", "admin"]), createSkill);
router.get('/skills', getAllSkills);
router.get('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), getSkillById);
router.put('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), updateSkill);
router.patch('/skills/:id/toggle', verifyAllToken(["labour", "contractor", "admin"]), toggleSkillStatus);
router.delete('/skills/:id', verifyAllToken(["labour", "contractor", "admin"]), deleteSkill);
router.delete('/skills', verifyAllToken(["labour", "contractor", "admin"]), deleteMultipleSkills);

module.exports = router; 