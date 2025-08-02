const express = require("express");
const { getAllAppointments, updateAppointmentStatus } = require('../../controllers/admin/appointmentAdminController');
const { verifyAllToken } = require("../../middleware/verifyToken");

const router = express.Router();

router.get('/appointments', verifyAllToken(['admin']), getAllAppointments);
router.patch('/appointments/:appointmentId/status', verifyAllToken(['admin']), updateAppointmentStatus);

module.exports = router; 