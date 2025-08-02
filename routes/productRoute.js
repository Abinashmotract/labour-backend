const express = require("express");
const {
    createProduct,
    getAllProducts,
    // getProductsStylistWise,
    deleteProduct,
    deleteMultipleProducts,
    updateProduct,
    getProductDetails,
    getProductsByCategory,
    searchProducts
} = require('../controllers/productController');
const { verifyAllToken } = require("../middleware/verifyToken");
const { uploadToS3 } = require("../config/AWSConfig");


const router = express.Router();


router.post('/create', verifyAllToken(['admin']), uploadToS3, createProduct);
router.get('/admin/total-products', verifyAllToken(['admin', 'user']), getAllProducts);
router.get('/search', verifyAllToken(['admin', 'user']), searchProducts);
// router.get('/stylist/products', verifyAllToken(['admin']), getProductsStylistWise);
router.delete('/delete/:id', verifyAllToken(['admin']), deleteProduct);
router.delete('/delete', verifyAllToken(['admin']), deleteMultipleProducts);
router.patch('/update/:id', verifyAllToken(['admin']), uploadToS3, updateProduct);
router.get('/get/:id', verifyAllToken(['admin', 'user']), getProductDetails);
router.get('/get', verifyAllToken(['admin', 'user']), getProductsByCategory);

module.exports = router;
