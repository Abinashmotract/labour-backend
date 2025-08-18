const express = require("express");
const { loginAdmin, logoutAdmin, dashboardOverViews, adminCreateUser } = require('../../controllers/admin/adminAuthController');
const { verifyAllToken } = require("../../middleware/verifyToken");

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/overview', verifyAllToken(['admin']), dashboardOverViews);
router.post('/create-user', verifyAllToken(['admin']), adminCreateUser);

module.exports = router;
