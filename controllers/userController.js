const User = require("../models/userModel");

const mongoose = require("mongoose");

const { sendEmail } = require("../service/emailService");
const { sendNotification } = require("../service/notificationService");


// get users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "labour" })
            .select("-password -refreshToken -location -favorites -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");
        if (!users) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: "No Users found!",
                data: users
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Users fetched successfully!",
            data: users
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

const updateUserDetails = async (req, res) => {
    try {
        const { userId, ...rest } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "User ID is required",
            });
        }
        if (rest.email) {
            delete rest.email;
        }
        const updatedUser = await User.findByIdAndUpdate(userId, rest, {
            new: true,
            runValidators: true,
        }).select("-password -refreshToken -otp -otpAttempts -otpFailedAttempts");
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            status: 200,
            message: "User details updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message,
        });
    }
};

// get user by id
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id)
            .select("-password -refreshToken -favorites -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }
        res.status(200).json({
            success: true,
            status: 200,
            message: "User fetched successfully!",
            data: user
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        })
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const updateData = req.body;
        const updatedUser = await User.findByIdAndUpdate(id,
            { $set: updateData },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not updated!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "User updated succcesfully!",
            data: updatedUser
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

// delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "User deleted successfully!"
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

// PATCH /api/users/location
const updateLocation = async (req, res) => {
    try {
        const { longitude, latitude } = req.body;

        await User.findByIdAndUpdate(req.user.id, {
            location: {
                type: "Point",
                coordinates: [longitude, latitude],
                lastUpdated: new Date()
            }
        });

        res.status(200).json({ success: true, status: 200, message: "Location Updated!" });
    } catch (err) {
        res.status(500).json({ success: false, status: 500, message: err.message });
    }
};

// user search
const searchUsers = async (req, res) => {
    try {
        const {
            query,
            role,
            location,
            minRating,
            maxRating,
            date,  // 👈 added
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const searchQuery = {};

        // 🔍 Text search: name or email
        if (query) {
            searchQuery.$or = [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ];
        }

        // 🎭 Role filter
        if (role) {
            searchQuery.role = role;
        }

        // 📍 Location filter
        if (location) {
            searchQuery['location.city'] = { $regex: location, $options: 'i' };
        }

        // ⭐ Rating filter
        if (minRating || maxRating) {
            searchQuery.rating = {};
            if (minRating) searchQuery.rating.$gte = Number(minRating);
            if (maxRating) searchQuery.rating.$lte = Number(maxRating);
        }

        // 📅 Date filter (exact date match - full day)
        if (date) {
            const selectedDate = new Date(date);
            const nextDate = new Date(date);
            nextDate.setDate(selectedDate.getDate() + 1);
            searchQuery.createdAt = {
                $gte: selectedDate,
                $lt: nextDate
            };
        }

        // ⏱️ Sorting
        const sortOptions = {};
        const validSortFields = ['rating', 'lastLogin', 'createdAt'];
        if (validSortFields.includes(sortBy)) {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortOptions['createdAt'] = -1;
        }

        // 📄 Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find(searchQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .select('-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest')
            .lean();

        const total = await User.countDocuments(searchQuery);

        res.json({
            success: true,
            status: 200,
            message: "Search results successful!",
            count: users.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            users
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Search failed',
            error: error.message
        });
    }
};

// multiple delete users
const deleteMultipleUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        // Validate input
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'User IDs array is required'
            });
        }

        // Check if all IDs are valid
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Invalid user IDs',
                invalidIds
            });
        }

        // Perform deletion
        const result = await User.deleteMany({
            _id: { $in: userIds },
            role: { $ne: 'contractor' } // Prevent deleting admins (optional)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'No users found to delete'
            });
        }

        res.json({
            success: true,
            status: 200,
            message: `${result.deletedCount} users deleted successfully`,
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

// upload profile image
const uploadProfileImage = async (req, res) => {
    try {
        const id = req.query.id ? req.query.id : req.user.id;
        const fileUrl = req.fileLocations?.[0] || null;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        // Update profile picture field
        user.profilePicture = fileUrl || "";
        await user.save();

        res.status(200).json({
            success: true,
            status: 200,
            message: "Profile image uploaded successfully!",
            data: {
                profilePicture: fileUrl
            }
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

// Get contractor by ID (for contractors to view their own details)
const getContractorById = async (req, res) => {
    try {
        const { id } = req.params;
        const Contracter = require("../models/Contracter");
        
        // Check if user is accessing their own data or is admin
        const userRole = req.user.role;
        const userId = req.user.id;
        
        // Only allow contractors to access their own data, or admins to access any data
        if (userRole === 'contractor' && userId !== id) {
            return res.status(403).json({
                success: false,
                status: 403,
                message: "Access denied! You can only view your own profile."
            });
        }
        
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

module.exports = {
    getAllUsers,
    // verifyUserProfile,
    updateUserDetails,
    getUserById,
    updateUserProfile,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage,
    getContractorById
}