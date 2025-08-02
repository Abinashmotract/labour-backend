const express = require("express");
const {
    createCategory,
    getAllCategories,
    getOne,
    updateCategory,
    deleteCategory,
    toggleActive,
    getActiveCategories
} = require('../controllers/productCategoryController');
const { uploadToS3 } = require("../config/AWSConfig");
// const { verifyUser, verifyAdmin } = require("../middleware/verifyToken");


const router = express.Router();

router.get('/get-active', getActiveCategories);

// admin routes
router.post('/admin/create', uploadToS3, createCategory);
router.get('/admin/get-all', getAllCategories);
router.get('/admin/get/:id', getOne);
router.patch('/admin/update/:id', updateCategory);
router.patch('/admin/toggle/:id', toggleActive);
router.delete('/admin/delete/:id', deleteCategory);

module.exports = router;
