const express = require("express");
const {
    updateStylistProfile,
    handleCertificateUpload,
    handlePortfolioUpload,
    approveStylist,
    getAllStylists,
    deleteStylist,
    updateStylistLocation,
    getActiveStylists,
    updateShopDetails,
    addPhotos,
    getStylistById,
    addService,
    updateProfileImage,
    addExperience,
    addExpertise,
    getServices,
    toggleService,
    getStylistByServiceCategory,
    removeStylistDocument,
    searchStylists,
    addAvailability,
    getAvailability,
    deleteAvailability,
    deleteAvailabilitySlot,
    updateStep1,
    updateStep2, 
    updateStep3,
    updateStep4,
    updateStep5,
    updateStep6,
    updateStep7
} = require('../controllers/hairStylistController');
const { stylistLogout } = require("../controllers/authController");
const { verifyAllToken } = require("../middleware/verifyToken");
const { uploadToS3 } = require("../config/AWSConfig");
const { getStylistAppointments } = require("../controllers/userController");
const { updateAppointmentStatus } = require("../controllers/admin/appointmentAdminController");

const router = express.Router();

router.patch('/profile/:id', updateStylistProfile);
router.post('/:id/certificates', uploadToS3, handleCertificateUpload);
router.post('/:id/portfolio', uploadToS3, handlePortfolioUpload);
router.delete('/item/delete/:id/:docId', removeStylistDocument);
router.patch('/update-location', verifyAllToken(['stylist']), updateStylistLocation);
router.get('/get-active', getActiveStylists);
router.patch('/update-shop', verifyAllToken(['stylist']), updateShopDetails);
router.post('/add-photos', verifyAllToken(['stylist']), uploadToS3, addPhotos);
router.get('/get', verifyAllToken(['stylist', 'user']), getStylistById);
router.post('/add-service', verifyAllToken(['stylist']), addService);
router.get('/get-services', verifyAllToken(['stylist', 'user']), getServices);
router.patch('/toggle/:id', verifyAllToken(['stylist']), toggleService);
router.post('/profile-image', verifyAllToken(['stylist']), uploadToS3, updateProfileImage);
router.patch('/add-experience', verifyAllToken(['stylist']), addExperience);
router.patch('/add-expertise', verifyAllToken(['stylist']), addExpertise);
router.get('/service/get/:serviceId', getStylistByServiceCategory);
router.post('/logout', verifyAllToken(['stylist']), stylistLogout);

// availability routes set-availability
router.post('/set-availability/:id',  addAvailability);
router.get('/get-availability', verifyAllToken(['stylist', 'user']), getAvailability);
router.delete('/delete-availability/:date', verifyAllToken(['stylist']), deleteAvailability);
router.delete('/delete-availability-slot/:date', verifyAllToken(['stylist']), deleteAvailabilitySlot);
router.get('/appointments', verifyAllToken(['stylist']), getStylistAppointments);
router.patch('/appointments/:appointmentId/status', verifyAllToken(['stylist']), updateAppointmentStatus);


router.put('/profile/step1/:id', updateStep1);
router.put('/profile/step2/:id', updateStep2);
router.put('/profile/step3/:id', uploadToS3,updateStep3);
router.put('/profile/step4/:id', updateStep4);
router.put('/profile/step5/:id', updateStep5);
router.put('/profile/step6/:id', updateStep6);
router.put('/profile/step7/:id', uploadToS3,updateStep7);

// admin route
router.patch('/admin/toggle/:stylistId', approveStylist);
router.get('/admin/get-all', getAllStylists);
router.delete('/admin/delete-stylist/:id', verifyAllToken(['admin']), deleteStylist);
router.get('/admin/search-stylist', searchStylists);

module.exports = router;