const express = require('express');
const router = express.Router();
const { verifyAllToken } = require('../middleware/verifyToken');
const {
  submitAvailabilityRequest,
  getMyAvailabilityRequests,
  cancelAvailabilityRequest,
  getAvailableLabours,
  getAvailableLaboursByDate,
  getAvailabilityStatus,
  toggleAvailability,
  getAllLabourAvailabilityRequests
} = require('../controllers/labourAvailabilityController');

// Labour routes
router.post('/submit', verifyAllToken(['labour']), submitAvailabilityRequest);
router.get('/my-requests', verifyAllToken(['labour']), getMyAvailabilityRequests);
router.put('/cancel/:requestId', verifyAllToken(['labour']), cancelAvailabilityRequest);
router.get('/status', verifyAllToken(['labour']), getAvailabilityStatus);
router.post('/toggle', verifyAllToken(['labour']), toggleAvailability);

// Contractor routes
router.get('/available-labours', verifyAllToken(['contractor']), getAvailableLabours);
router.get('/available-labours-by-date', verifyAllToken(['contractor']), getAvailableLaboursByDate);

// Admin routes
router.get('/admin/all-requests', verifyAllToken(['admin']), getAllLabourAvailabilityRequests);

module.exports = router;
