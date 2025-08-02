const ProductCategory = require('../models/productCategoryModel');

// create product category
const createCategory = async (req, res) => {
  try {
    const { name, isActive } = req.body;

    const existingCategory = await ProductCategory.findOne({ name });
    if (existingCategory) {
      return res.json({
        success: false,
        status: 400,
        message: "Category already exists!"
      })
    }

    const fileUrl = req.fileLocations[0];

    await ProductCategory.create({ name, isActive, ison: fileUrl });
    res.json({
      success: true,
      status: 201,
      message: "Category created successfully!"
    });

  } catch (err) {
    res.json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// Get all product categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.find();
    res.status(200).json({
      success: true,
      status: 200,
      message: "Categories fetched successfully!",
      //   message: categories.length === 0 ? "No categories found!" : "Categories fetched successfully!",
      count: categories.length,
      data: categories
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// Get a single product category
const getOne = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'No category found with that ID'
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Category fetched successfully!",
      data: category
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// Update a product category
const updateCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'No category found with that ID'
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Category updated successfully!",
      data: category
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// Delete a product category
const deleteCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'No category found with that ID'
      });
    }
    res.status(200).json({
      success: true,
      status: 200,
      message: "Category deleted successfully!"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// Toggle active status
const toggleActive = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: 'No category found with that ID'
      });
    }
    category.isActive = !category.isActive;
    await category.save();

    res.status(200).json({
      success: true,
      status: 200,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully!`,
      data: category
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      status: 500,
      message: err.message
    });
  }
};

// get active categories
const getActiveCategories = async (req, res) => {
  try {
    const activeCategories = await ProductCategory.find({ isActive: true });

    res.status(200).json({
      success: true,
      status: 200,
      message: activeCategories.length === 0 ? "No categories found!" : "Categories fetched successfully!",
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
  createCategory,
  getAllCategories,
  getOne,
  updateCategory,
  deleteCategory,
  toggleActive,
  getActiveCategories
}