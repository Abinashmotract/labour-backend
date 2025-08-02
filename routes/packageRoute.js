const express = require("express");
const {
    createPackage,
    getPackage,
    deletePackage,
    updatePackageByStylist,
    getStylistPackages,
    getCoverPackages
} = require('../controllers/packageController');
const { verifyAllToken } = require("../middleware/verifyToken");
const { uploadToS3 } = require("../config/AWSConfig");

const router = express.Router();

router.post('/create', verifyAllToken(['stylist']), uploadToS3, createPackage);
router.get('/get', getPackage);
router.delete('/delete/:id', deletePackage);
router.patch('/update/:id', verifyAllToken(['stylist']), uploadToS3, updatePackageByStylist);
router.get('/stylist/get', verifyAllToken(['stylist']), getStylistPackages);
router.get('/cover/get', getCoverPackages);


module.exports = router;
