const mongoose = require("mongoose");
const User = require("../models/userModel");
const Contracter = require("../models/Contracter");
const { getAddressFromCoordinates } = require("../utils/geocoding");

// get users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["labour", "contractor"] },
    }).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );

    if (!users || users.length === 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "No signup users found!",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Signup users fetched successfully!",
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const toggleContractorAgent = async (req, res) => {
  try {
    const contractorId = req.params.id;
    const contractor = await User.findOne({ _id: contractorId, role: "contractor" });
    if (!contractor) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Contractor not found!",
      });
    }
    contractor.isAgent = !contractor.isAgent;
    await contractor.save();
    return res.status(200).json({
      success: true,
      status: 200,
      message: `Contractor agent status updated: ${contractor.isAgent}`,
      data: contractor
    });
  } catch (error) {
    console.error("toggleContractorAgent error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const getLabourDetailsById = async (req, res) => {
  try {
    const labourId = req.user.id; // 🔹 token se labour id

    const labour = await User.findOne({
      _id: labourId,
      role: "labour",
    }).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );

    if (!labour) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Labour not found!",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Labour details fetched successfully!",
      data: labour,
    });
  } catch (error) {
    console.error("Get labour details error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const getLoggedInUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found!",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "User fetched successfully!",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const updateRoleBasisUser = async (req, res) => {
  try {
    const { userId, firstName, lastName, email, addressLine1, work_category, work_experience, gender } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, status: 400, message: "User ID is required" });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, status: 404, message: "User not found" });
    if (!["labour", "contractor"].includes(user.role)) {
      return res.status(403).json({ success: false, status: 403, message: "Only labour/contractor users can be updated here" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (work_category) user.work_category = work_category;
    if (work_experience) user.work_experience = work_experience;
    if (gender) user.gender = gender;

    // ✅ Update address and coordinates from typed address
    if (addressLine1) {
      try {
        const geo = await getAddressFromCoordinates(addressLine1);
        user.location = { type: "Point", coordinates: [geo.longitude, geo.latitude] };
        user.addressLine1 = geo.formattedAddress; // store formatted address
      } catch (err) {
        console.warn("Geocoding failed:", err.message);
        user.addressLine1 = addressLine1; // fallback
      }
    }

    if (req.fileLocations?.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Update role basis user error:", error);
    return res.status(500).json({ success: false, status: 500, message: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const updateData = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not updated!",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "User updated succcesfully!",
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

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "User not found!",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "User deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

const updateLocation = async (req, res) => {
  try {
    const { longitude, latitude } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        lastUpdated: new Date(),
      },
    });

    res
      .status(200)
      .json({ success: true, status: 200, message: "Location Updated!" });
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
      date, // 👈 added
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = req.query;

    const searchQuery = {};

    // 🔍 Text search: name or email
    if (query) {
      searchQuery.$or = [
        { fullName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    // 🎭 Role filter
    if (role) {
      searchQuery.role = role;
    }

    // 📍 Location filter
    if (location) {
      searchQuery["location.city"] = { $regex: location, $options: "i" };
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
        $lt: nextDate,
      };
    }

    // ⏱️ Sorting
    const sortOptions = {};
    const validSortFields = ["rating", "lastLogin", "createdAt"];
    if (validSortFields.includes(sortBy)) {
      sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;
    } else {
      sortOptions["createdAt"] = -1;
    }

    // 📄 Pagination
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit))
      .select(
        "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
      )
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
      users,
    });
  } catch (error) {
    console.error("User search error:", error);
    res.status(500).json({
      success: false,
      status: 500,
      message: "Search failed",
      error: error.message,
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
        message: "User IDs array is required",
      });
    }

    // Check if all IDs are valid
    const invalidIds = userIds.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id)
    );
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Invalid user IDs",
        invalidIds,
      });
    }

    // Perform deletion
    const result = await User.deleteMany({
      _id: { $in: userIds },
      role: { $ne: "contractor" }, // Prevent deleting admins (optional)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "No users found to delete",
      });
    }

    res.json({
      success: true,
      status: 200,
      message: `${result.deletedCount} users deleted successfully`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Bulk delete error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete users",
      error: error.message,
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
        message: "User not found!",
      });
    }

    user.profileImage = fileUrl || " ";
    await user.save();

    res.status(200).json({
      success: true,
      status: 200,
      message: "Profile image uploaded successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

// Get all labours (for contractor side)
const getAllLabours = async (req, res) => {
  try {
    const contractorId = req.user.id;
    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== "contractor") {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Only contractors can access this data",
      });
    }
    const contractorCategory = contractor.work_category;

    if (!contractorCategory) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Contractor has no work category defined",
      });
    }
    const labours = await User.find({
      role: "labour",
      work_category: contractorCategory,
    }).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );
    if (!labours || labours.length === 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: "No matching labours found!",
        total: 0,
        data: [],
      });
    }
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Matching labours fetched successfully!",
      total: labours.length,
      data: labours,
    });
  } catch (error) {
    console.error("Get labours error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  toggleContractorAgent,
  getLabourDetailsById,
  getAllLabours,
  updateRoleBasisUser,
  getLoggedInUser,
  updateUserProfile,
  deleteUser,
  updateLocation,
  searchUsers,
  deleteMultipleUsers,
  uploadProfileImage,
};
