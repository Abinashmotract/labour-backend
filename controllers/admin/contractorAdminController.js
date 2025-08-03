const Contracter = require('../../models/Contracter');
const createError = require('../../middleware/error');

// Get all contractors
const getAllContractors = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        
        let query = {};
        
        // Filter by approval status
        if (status === 'approved') {
            query.isApproved = true;
        } else if (status === 'pending') {
            query.isApproved = false;
        }
        
        // Search functionality
        if (search) {
            query.$or = [
                { fullName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { work_category: { $regex: search, $options: 'i' } }
            ];
        }
        
        const contractors = await Contracter.find(query)
            .select('-password -refreshToken -otp -otpExpiration -lastOtpRequest')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Contracter.countDocuments(query);
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Contractors fetched successfully!",
            data: {
                contractors,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                total
            }
        });
    } catch (error) {
        console.error("Error in getAllContractors:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Get contractor by ID
const getContractorById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const contractor = await Contracter.findById(id)
            .select('-password -refreshToken -otp -otpExpiration -lastOtpRequest');
            
        if (!contractor) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Contractor not found!"
            });
        }
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Contractor fetched successfully!",
            data: contractor
        });
    } catch (error) {
        console.error("Error in getContractorById:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Approve/Disapprove contractor
const updateContractorApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { isApproved } = req.body;
        
        if (typeof isApproved !== 'boolean') {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "isApproved must be a boolean value"
            });
        }
        
        const contractor = await Contracter.findByIdAndUpdate(
            id,
            { isApproved },
            { new: true }
        ).select('-password -refreshToken -otp -otpExpiration -lastOtpRequest');
        
        if (!contractor) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Contractor not found!"
            });
        }
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: `Contractor ${isApproved ? 'approved' : 'disapproved'} successfully!`,
            data: contractor
        });
    } catch (error) {
        console.error("Error in updateContractorApproval:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Delete contractor
const deleteContractor = async (req, res) => {
    try {
        const { id } = req.params;
        
        const contractor = await Contracter.findByIdAndDelete(id);
        
        if (!contractor) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Contractor not found!"
            });
        }
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Contractor deleted successfully!"
        });
    } catch (error) {
        console.error("Error in deleteContractor:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Delete multiple contractors
const deleteMultipleContractors = async (req, res) => {
    try {
        const { contractorIds } = req.body;
        
        if (!contractorIds || !Array.isArray(contractorIds) || contractorIds.length === 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "contractorIds array is required"
            });
        }
        
        const result = await Contracter.deleteMany({
            _id: { $in: contractorIds }
        });
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: `${result.deletedCount} contractor(s) deleted successfully!`
        });
    } catch (error) {
        console.error("Error in deleteMultipleContractors:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

// Get contractor statistics
const getContractorStats = async (req, res) => {
    try {
        const totalContractors = await Contracter.countDocuments();
        const approvedContractors = await Contracter.countDocuments({ isApproved: true });
        const pendingContractors = await Contracter.countDocuments({ isApproved: false });
        
        // Get contractors by work category
        const contractorsByCategory = await Contracter.aggregate([
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
        
        return res.status(200).json({
            success: true,
            status: 200,
            message: "Contractor statistics fetched successfully!",
            data: {
                totalContractors,
                approvedContractors,
                pendingContractors,
                contractorsByCategory
            }
        });
    } catch (error) {
        console.error("Error in getContractorStats:", error);
        return res.status(500).json({
            success: false,
            status: 500,
            message: "Internal Server Error"
        });
    }
};

module.exports = {
    getAllContractors,
    getContractorById,
    updateContractorApproval,
    deleteContractor,
    deleteMultipleContractors,
    getContractorStats
}; 