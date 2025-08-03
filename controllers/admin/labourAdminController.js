const User = require('../../models/userModel');
const createError = require('../../middleware/error');

// Get all labour
const getAllLabour = async (req, res) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        
        let query = { role: 'labour' };
        
        // Search functionality
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { work_category: { $regex: search, $options: 'i' } }
            ];
        }
        
        const labour = await User.find(query)
            .select('-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await User.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Labour fetched successfully!",
            data: {
                labour,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        console.error("Error in getAllLabour:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Get labour by ID
const getLabourById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const labour = await User.findOne({ _id: id, role: 'labour' })
            .select('-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest');
            
        if (!labour) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Labour not found!"
            });
        }
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Labour fetched successfully!",
            data: labour
        });
    } catch (error) {
        console.error("Error in getLabourById:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Delete labour
const deleteLabour = async (req, res) => {
    try {
        const { id } = req.params;
        
        const labour = await User.findOneAndDelete({ _id: id, role: 'labour' });
        
        if (!labour) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Labour not found!"
            });
        }
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Labour deleted successfully!"
        });
    } catch (error) {
        console.error("Error in deleteLabour:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Delete multiple labour
const deleteMultipleLabour = async (req, res) => {
    try {
        const { labourIds } = req.body;
        
        if (!labourIds || !Array.isArray(labourIds) || labourIds.length === 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "labourIds array is required"
            });
        }
        
        const result = await User.deleteMany({
            _id: { $in: labourIds },
            role: 'labour'
        });
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: `${result.deletedCount} labour deleted successfully!`
        });
    } catch (error) {
        console.error("Error in deleteMultipleLabour:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Get labour statistics
const getLabourStats = async (req, res) => {
    try {
        const totalLabour = await User.countDocuments({ role: 'labour' });
        
        // Get labour by work category
        const labourByCategory = await User.aggregate([
            {
                $match: { role: 'labour' }
            },
            {
                $group: {
                    _id: '$work_category',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        // Get labour by gender
        const labourByGender = await User.aggregate([
            {
                $match: { role: 'labour' }
            },
            {
                $group: {
                    _id: '$gender',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Labour statistics fetched successfully!",
            data: {
                totalLabour,
                labourByCategory,
                labourByGender
            }
        });
    } catch (error) {
        console.error("Error in getLabourStats:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    getAllLabour,
    getLabourById,
    deleteLabour,
    deleteMultipleLabour,
    getLabourStats
}; 