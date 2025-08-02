const express = require("express");
const {
    addToCart,
    getCart,
    removeFromCart,
    mergeCarts,
    updateQuantity
} = require('../controllers/cartController');
const { verifyAllToken } = require("../middleware/verifyToken");


const router = express.Router();

router.post('/create', verifyAllToken(['user']), addToCart);
router.get('/get-cart', verifyAllToken(['user', 'admin']), getCart);
router.post('/remove/:productId', removeFromCart);
router.post('/merge-carts', verifyAllToken(['user']), mergeCarts);
router.patch('/update-quantity', verifyAllToken(['user']), updateQuantity)

module.exports = router;
