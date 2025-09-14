const mongoose = require("mongoose");
const User = require("../models/userModel");
const { sendEmail } = require("../service/emailService");
const { sendNotification } = require("../service/notificationService");

// get users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: { $in: ["labour", "contractor"] } })
            .select("-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");

        if (!users || users.length === 0) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: "No signup users found!",
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Signup users fetched successfully!",
            data: users
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// get user by id (labour / contractor)
const getLoggedInUser = async (req, res) => {
    try {
        const userId = req.user.id; // coming from token middleware

        const user = await User.findById(userId)
            .select("-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");

        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        return res.status(200).json({
            success: true,
            status: 200,
            message: "User fetched successfully!",
            data: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

const updateRoleBasisUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "User ID is required",
      });
    }
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found",
      });
    }
    if (!["labour", "contractor"].includes(user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Only labour/contractor users can be updated here",
      });
    }
    const {
      firstName,
      lastName,
      email,
      addressLine1,
      work_category,
      work_experience,
      gender,
      lat,
      lng,
    } = req.body;

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (addressLine1) user.addressLine1 = addressLine1;
    if (work_category) user.work_category = work_category;
    if (work_experience) user.work_experience = work_experience;
    if (gender) user.gender = gender;
    if (lat && lng) {
      user.location = {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
    }
    if (req.fileLocations && req.fileLocations.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }
    await user.save();
    return res.status(200).json({
      success: true,
      status: 200,
      message: "User updated successfully",
      data: {
        userId: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        gender: user.gender,
        work_category: user.work_category,
        work_experience: user.work_experience,
        location: user.location,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error("Update role basis user error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
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
        const fileUrl = req.fileLocations;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        user.profileImage = fileUrl || " ";
        await user.save();

        res.status(200).json({
            success: true,
            status: 200,
            message: "Profile image uploaded successfully!"
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
    getAllUsers,
    // verifyUserProfile,
    updateRoleBasisUser,
    getLoggedInUser,
    updateUserProfile,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage
}