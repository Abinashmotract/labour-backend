const express = require("express");
const {loginAdmin, logoutAdmin, dashboardOverViews} = require('../../controllers/admin/adminAuthController');
const { verifyAllToken } = require("../../middleware/verifyToken");

const router = express.Router();

router.post('/login', loginAdmin);
router.post('/logout', logoutAdmin);
router.get('/overview', verifyAllToken(['admin']), dashboardOverViews);

module.exports = router;
