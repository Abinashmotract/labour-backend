const express = require("express");
const {
    createService,
    getServices,
    getActiveServices,
    deleteService,
    activateService,
    getSubServicesByService,
    createSubservice,
    deleteSubService,
    getSubServices,
    getActiveSubServices
} = require('../controllers/serviceCategoryController');
const { verifyAllToken } = require("../middleware/verifyToken");
const { uploadToS3 } = require("../config/AWSConfig");
// const { verifyUser, verifyAdmin } = require("../middleware/verifyToken");


const router = express.Router();

router.get('/get-active', getActiveServices);

// subservice routes
router.get('/subservice/get/:id', verifyAllToken(["admin", "user", "stylist"]), getSubServicesByService);
router.post('/subservice/create', verifyAllToken(["admin"]), createSubservice);
router.get('/subservice/get', verifyAllToken(["admin"]), getSubServices);
router.delete('/subservice/delete/:id', verifyAllToken(["admin"]), deleteSubService);
router.get('/subservice/active/get/:id', getActiveSubServices);

// admin routes
router.post('/admin/create', uploadToS3, createService);
router.get('/admin/get', getServices);
router.delete('/admin/delete/:id', deleteService);
router.patch('/admin/toggle/:id', activateService);

module.exports = router;
