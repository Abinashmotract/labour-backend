const Cart = require("../models/cartModel");
const Product = require("../models/productModel");
const jwt = require('jsonwebtoken');

// create cart
const addToCart = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const token = req.headers.authorization?.split(' ')[1];

        // Fetch product details (price, name, image)
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Determine cart owner (user or session)
        let cartFilter;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                cartFilter = { userId: decoded.id }; // Use user ID from token
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Invalid token"
                });
            }
        } else {
            cartFilter = { sessionId: req.sessionID }; // Fallback to session
        }

        // Find or create cart
        let cart = await Cart.findOne(cartFilter);
        if (!cart) {
            cart = new Cart({ ...cartFilter, items: [] });
        }

        // Update existing item or add new
        const existingItem = cart.items.find(item =>
            item.productId.toString() === productId
        );
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({
                productId,
                quantity,
                price: product.price,
                name: product.name,
                image: product.photos[0], // Store first image
            });
        }

        await cart.save();
        res.status(201).json({
            success: true,
            status: 201,
            message: "Product Added successfully!",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 500,
            error: error.message
        });
    }
};

// get cart
const getCart = async (req, res) => {
    try {

        const token = req.headers.authorization?.split(' ')[1];

        let cartFilter;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                cartFilter = { userId: decoded.id };
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Invalid or expired token"
                });
            }
        } else {
            cartFilter = { sessionId: req.sessionID }; // Fallback to session
        }

        const cart = await Cart.findOne(cartFilter);

        res.status(200).json({
            success: true,
            status: 200,
            message: "Cart fetched successfully!",
            data: cart || { items: [] }
        }); // Return empty cart if none exists
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 500,
            error: error.message
        });
    }
};

// remove from cart
const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const token = req.headers.authorization?.split(' ')[1];

        let cartFilter;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                cartFilter = { userId: decoded.id };
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    status: 401,
                    message: "Invalid or expired token"
                });
            }
        } else {
            cartFilter = { sessionId: req.sessionID }; // Fallback to session
        }
        const cart = await Cart.findOne(cartFilter);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Filter out the item
        const initialCount = cart.items.length;
        cart.items = cart.items.filter(
            item => item.productId.toString() !== productId
        );

        // No change means product wasn't found
        if (cart.items.length === initialCount) {
            return res.status(404).json({
                success: false,
                message: "Product not found in cart",
                data: {
                    cartId: cart._id,
                    remainingItems: cart.items.length
                }
            });
        }

        await cart.save();
        res.status(200).json({
            success: true,
            status: 200,
            message: "Product removed successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            status: 500,
            error: error.message
        });
    }
};

// merge cart
const mergeCarts = async (sessionId, userId) => {
    try {
        // Step 1: Find the guest cart
        const guestCart = await Cart.findOne({ sessionId });
        if (!guestCart) {
            console.log('No guest cart found to merge.');
            return await Cart.findOne({ userId }); // Return existing user cart (or null)
        }

        // Step 2: Find or create the user cart
        let userCart = await Cart.findOne({ userId });

        if (!userCart) {
            // Case: User has no cart → adopt the guest cart
            userCart = await Cart.create({
                userId,
                items: guestCart.items,
            });
        } else {
            // Case: Merge guest cart items into user cart
            guestCart.items.forEach((guestItem) => {
                const existingItem = userCart.items.find((item) =>
                    item.productId.equals(guestItem.productId)
                );

                if (existingItem) {
                    // Update quantity if product exists
                    existingItem.quantity += guestItem.quantity;
                } else {
                    // Add new item if product doesn't exist
                    userCart.items.push(guestItem);
                }
            });

            await userCart.save();
        }

        // Step 3: Delete the guest cart (optional but recommended)
        await Cart.deleteOne({ sessionId });
        return userCart;
    } catch (error) {
        console.error('Error merging carts:', error);
        throw error; // Let the caller handle the error
    }
};


// update quantity
const updateQuantity = async (req, res) => {
    try {
        const { productId, operation } = req.body;

        // Determine cart identifier (JWT user ID or session ID)
        let cartQuery;
        if (req.sessionID) {
            // Guest user (session ID present)
            cartQuery = { sessionId: req.sessionID };
        } else if (req.user) {
            // Authenticated user (JWT token present)
            cartQuery = { userId: req.user.id };
        } else {
            return res.status(401).json({
                success: false,
                status: 401,
                message: "Unauthorized: No token or session ID provided",
            });
        }

        // Find the cart
        const cart = await Cart.findOne(cartQuery);
        if (!cart) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Cart not found",
            });
        }

        // Find the item in cart
        const itemIndex = cart.items.findIndex(
            (item) => item.productId.toString() === productId
        );
        if (itemIndex === -1) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Product not found in cart",
            });
        }

        const item = cart.items[itemIndex];

        // Validate and update quantity
        if (operation === "increase") {
            if (item.quantity >= 10) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: "Maximum quantity reached (10)",
                });
            }
            item.quantity += 1;
        } else if (operation === "decrease") {
            if (item.quantity <= 1) {
                return res.status(400).json({
                    success: false,
                    status: 400,
                    message: "Minimum quantity reached (1)",
                });
            }
            item.quantity -= 1;
        } else {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Invalid operation (must be 'increase' or 'decrease')",
            });
        }

        // Save the updated cart
        await cart.save();

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Cart updated successfully!",
            data: cart,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message || "Internal server error",
        });
    }
};

module.exports = {
    addToCart,
    getCart,
    removeFromCart,
    mergeCarts,
    updateQuantity
}