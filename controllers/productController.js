const Product = require("../models/productModel");
const Stylist = require("../models/hairStylistModel");
const mongoose = require("mongoose");


// create product
const createProduct = async (req, res) => {
    try {
        const { name, subtitle, about, price, stockQuantity, goodToKnow, quickTips, manufacturer, category } = req.body
        const existingProduct = await Product.findOne({ name });
        if (existingProduct) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Product already exists!"
            });
        }

        const fileUrls = req.fileLocations || [];

        if (fileUrls.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        const newProduct = await Product.create({
            // stylist: stylistId,
            name,
            subtitle,
            about,
            price,
            stockQuantity,
            goodToKnow,
            quickTips,
            manufacturer,
            category,
            photos: fileUrls,
        });

        res.status(201).json({
            success: true,
            status: 201,
            message: "Product created successfully!",
            data: newProduct
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        })
    }
};

// get products
const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find({ inStock: true }).populate("category", "name");
        res.status(200).json({
            success: true,
            status: 200,
            message: products.length === 0 ? "No products found!" : "Products fetched successfully!",
            data: products
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// get products
const searchProducts = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Search query is required"
            });
        }
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: "i" } },
                { subtitle: { $regex: query, $options: "i" } }
            ]
        }).populate("category", "name");
        res.status(200).json({
            success: true,
            status: 200,
            message: products.length ? "Products found" : "No products found",
            data: products
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};


// get products stylist wise
// const getProductsStylistWise = async (req, res) => {
//     try {
//         const stylistId = req.user.id;
//         const stylist = await Stylist.findById(stylistId);
//         if (!stylist) {
//             return res.status(404).json({
//                 success: false,
//                 status: 404,
//                 message: "Stylist not found!"
//             });
//         }

//         const products = await Product.find({ stylist: stylistId }).populate("category", "name");

//         res.status(200).json({
//             success: true,
//             status: 200,
//             message: products.length === 0 ? "No products found!" : "Products fetcehd successfully!",
//             data: products
//         });
//     }
//     catch (error) {
//         return res.status(500).json({
//             success: false,
//             status: 500,
//             message: error.message
//         });
//     }
// };

// delete products
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findByIdAndDelete(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Product not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Product deleted successfully!",
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// delete multiple products
const deleteMultipleProducts = async (req, res) => {
    try {
        const { productsIds } = req.body;

        // Validate input
        if (!productsIds || !Array.isArray(productsIds)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Products IDs array is required'
            });
        }

        // Check if all IDs are valid
        const invalidIds = productsIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Invalid user IDs',
                invalidIds
            });
        }

        // Perform deletion
        const result = await Product.deleteMany({
            _id: { $in: productsIds },
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'No products found to delete'
            });
        }

        res.json({
            success: true,
            status: 200,
            message: `${result.deletedCount} products deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users',
            error: error.message
        });
    }
};

// update products
const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Product not found!"
            });
        }

        const updateData = req.body;
        const updatedProduct = await Product.findByIdAndUpdate(productId,
            { $set: updateData },
            { new: true });

        res.status(200).json({
            success: true,
            status: 200,
            message: "Product updated successfully!",
            data: updatedProduct
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }

};

// get product details
const getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId).populate("category", "name");
        if (!product) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Product not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Product fetched successfully!",
            data: product
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// get products category wise
const getProductsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;

        const products = await Product.find({ category: categoryId });

        res.status(200).json({
            success: true,
            status: 200,
            message: products.length === 0 ? "No products found!" : "Products fetched successflly!"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    searchProducts,
    // getProductsStylistWise,
    deleteProduct,
    deleteMultipleProducts,
    updateProduct,
    getProductDetails,
    getProductsByCategory
}