const mongoose = require("mongoose");
const User = require("../models/userModel");
const Contracter = require("../models/Contracter");
const { getAddressFromCoordinates } = require("../utils/geocoding");
const JobApplication = require("../models/jobApplicationModel");
const LabourAvailability = require("../models/labourAvailabilityModel");
const Notification = require("../models/notificationModel");
const JobPost = require("../models/jobPostModel");

// Utility: generate unique referral code
async function generateUniqueReferralCode(prefix = "AGT", length = 6) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  let exists = true;
  while (exists) {
    code = prefix + "-" + Array.from({ length }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
    exists = await User.exists({ referralCode: code });
  }
  return code;
}

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
        message: "कोई साइनअप उपयोगकर्ता नहीं मिला!",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "साइनअप उपयोगकर्ता सफलतापूर्वक प्राप्त!",
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
        message: "ठेकेदार नहीं मिला!",
      });
    }

    contractor.isAgent = !contractor.isAgent;

    // If toggling ON to agent, generate referralCode if not already present
    if (contractor.isAgent && !contractor.referralCode) {
      try {
        const code = await generateUniqueReferralCode();
        contractor.referralCode = code;
      } catch (err) {
        console.error("Referral code generation failed:", err);
        // don't block the toggle - still save without code (or you might return error)
      }
    }

    // optional: if toggling off, you might want to keep referralCode or clear it.
    // currently we keep it (so old referrals still refer to same code).
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

const getLaboursByAgent = async (req, res) => {
  try {
    const agentId = req.params.agentId;
    const agent = await User.findOne({ _id: agentId, isAgent: true, role: "contractor" });
    if (!agent) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "एजेंट नहीं मिला",
      });
    }
    const labours = await User.find({ referredBy: agentId, role: "labour" })
      .select("-password -otp -otpExpiry");

    return res.status(200).json({
      success: true,
      status: 200,
      message: `Labours referred by agent ${agent.firstName} fetched successfully`,
      data: labours,
    });

  } catch (error) {
    console.error("getLaboursByAgent error:", error);
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
        message: "मजदूर नहीं मिला!",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "मजदूर विवरण सफलतापूर्वक प्राप्त!",
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
        message: "उपयोगकर्ता नहीं मिला!",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "उपयोगकर्ता सफलतापूर्वक प्राप्त!",
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
    const {
      userId,
      firstName,
      lastName,
      email,
      addressLine1,
      work_category,
      work_experience,
      gender,
      isAgent,        // allow update
      referralCode,   // optional
      lat,
      lng
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, status: 400, message: "यूजर आईडी आवश्यक है" });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, status: 404, message: "उपयोगकर्ता नहीं मिला" });

    if (!["labour", "contractor"].includes(user.role)) {
      return res.status(403).json({ success: false, status: 403, message: "यहां केवल मजदूर/ठेकेदार उपयोगकर्ता अपडेट किए जा सकते हैं" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (work_category) user.work_category = work_category;
    if (work_experience) user.work_experience = work_experience;
    if (gender) user.gender = gender;

    // ✅ Update agent status only if contractor
    if (user.role === "contractor") {
      if (typeof isAgent !== "undefined") {
        user.isAgent = isAgent;
      }
    }

    // ✅ Handle referralCode (only labour)
    if (user.role === "labour" && referralCode) {
      const agent = await User.findOne({ referralCode, isAgent: true, role: "contractor" });
      if (agent && !user.referredBy) {
        user.referredBy = agent._id;
        agent.referralsCount = (agent.referralsCount || 0) + 1;
        await agent.save();
      }
    }

    // ✅ Update location (lat/lng preferred)
    if (lat && lng) {
      user.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
      try {
        const address = await getAddressFromCoordinates(lat, lng);
        user.addressLine1 = address;
      } catch (err) {
        console.warn("Reverse geocoding failed:", err.message);
      }
    } else if (addressLine1) {
      // fallback if only address is given
      user.addressLine1 = addressLine1;
    }

    if (req.fileLocations?.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "उपयोगकर्ता सफलतापूर्वक अपडेट",
      data: user,
    });
  } catch (error) {
    console.error("Update role basis user error:", error);
    return res.status(500).json({ success: false, status: 500, message: error.message });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const {
      userId,
      firstName,
      lastName,
      email,
      addressLine1,
      work_category,
      work_experience,
      gender,
      isAgent,
      lat,
      lng
    } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, status: 400, message: "User ID is required" });
    }

    let user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, status: 404, message: "User not found" });

    if (!["labour", "contractor"].includes(user.role)) {
      return res.status(403).json({ success: false, status: 403, message: "Only labour/contractor users can be updated" });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email.toLowerCase();
    if (work_category) user.work_category = work_category;
    if (work_experience) user.work_experience = work_experience;
    if (gender) user.gender = gender;

    // Update agent status only if contractor
    if (user.role === "contractor") {
      if (typeof isAgent !== "undefined") {
        user.isAgent = isAgent;
      }
    }

    // Update location (lat/lng preferred)
    if (lat && lng) {
      user.location = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };
      try {
        const address = await getAddressFromCoordinates(lat, lng);
        user.addressLine1 = address;
      } catch (err) {
        console.warn("Reverse geocoding failed:", err.message);
      }
    } else if (addressLine1) {
      // fallback if only address is given
      user.addressLine1 = addressLine1;
    }

    if (req.fileLocations?.profilePicture) {
      user.profilePicture = req.fileLocations.profilePicture;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Admin update user error:", error);
    return res.status(500).json({ success: false, status: 500, message: error.message });
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
        message: "उपयोगकर्ता नहीं मिला!",
      });
    }

    res.status(200).json({
      success: true,
      status: 200,
      message: "उपयोगकर्ता सफलतापूर्वक हटाया गया!",
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
      .json({ success: true, status: 200, message: "स्थान अपडेट!" });
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
      date,
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
      message: "खोज परिणाम सफल!",
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
      message: "खोज असफल",
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
        message: "यूजर आईडी सरणी आवश्यक है",
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
        message: "अमान्य यूजर आईडी",
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
        message: "हटाने के लिए कोई उपयोगकर्ता नहीं मिला",
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
    const fileUrl = req.fileLocations?.profilePicture;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "उपयोगकर्ता नहीं मिला!",
      });
    }

    user.profilePicture = fileUrl || "";
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
    const { availabilityDate } = req.query; // Get availability date from query params
    
    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== "contractor") {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "केवल ठेकेदार ही इस डेटा तक पहुंच सकते हैं",
      });
    }
    const contractorCategory = contractor.work_category;

    if (!contractorCategory) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "ठेकेदार का कोई कार्य श्रेणी परिभाषित नहीं है",
      });
    }

    // Base query for labours
    let labourQuery = {
      role: "labour",
      work_category: contractorCategory,
    };

    let labours = await User.find(labourQuery).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );

    // If availability date is provided, filter labours who are available on that date
    if (availabilityDate) {
      try {
        const requestedDate = new Date(availabilityDate);
        if (isNaN(requestedDate.getTime())) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: "अमान्य तिथि प्रारूप",
          });
        }

        // Normalize the date to start of day
        requestedDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Find labour IDs who are available on the requested date
        const LabourAvailability = require('../models/labourAvailabilityModel');
        const availableLabours = await LabourAvailability.find({
          availabilityDate: {
            $gte: requestedDate,
            $lte: endOfDay
          },
          status: 'active'
        }).select('labour');

        const availableLabourIds = availableLabours.map(avail => avail.labour);

        // Filter labours to only include those who are available
        labours = labours.filter(labour => availableLabourIds.includes(labour._id.toString()));

        // Add availability information to each labour
        labours = await Promise.all(labours.map(async (labour) => {
          const availability = await LabourAvailability.findOne({
            labour: labour._id,
            availabilityDate: {
              $gte: requestedDate,
              $lte: endOfDay
            },
            status: 'active'
          }).populate('skills', 'name nameHindi category');

          return {
            ...labour.toObject(),
            availability: availability ? {
              availabilityDate: availability.availabilityDate,
              skills: availability.skills,
              location: availability.location,
              status: availability.status
            } : null
          };
        }));

      } catch (dateError) {
        console.error("Date filtering error:", dateError);
        return res.status(400).json({
          success: false,
          status: 400,
          message: "तिथि फ़िल्टरिंग में त्रुटि",
        });
      }
    }

    if (!labours || labours.length === 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: availabilityDate ? "इस तिथि पर कोई उपलब्ध मजदूर नहीं मिला!" : "कोई मिलान करने वाला मजदूर नहीं मिला!",
        total: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: availabilityDate ? "उपलब्ध मजदूर सफलतापूर्वक प्राप्त किए गए!" : "मिलान करने वाले मजदूर सफलतापूर्वक प्राप्त किए गए!",
      total: labours.length,
      data: labours,
      filterApplied: availabilityDate ? {
        availabilityDate: availabilityDate,
        description: `मजदूर जो ${new Date(availabilityDate).toLocaleDateString('hi-IN')} को उपलब्ध हैं`
      } : null
    });
  } catch (error) {
    console.error("Get labours error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

// Search all labours (for contractor side)
const searchAllLabours = async (req, res) => {
  try {
    const contractorId = req.user.id;
    const { search, availabilityDate } = req.query;
    
    const contractor = await User.findById(contractorId);
    if (!contractor || contractor.role !== "contractor") {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "केवल ठेकेदार ही इस डेटा तक पहुंच सकते हैं",
      });
    }
    const contractorCategory = contractor.work_category;

    if (!contractorCategory) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "ठेकेदार का कोई कार्य श्रेणी परिभाषित नहीं है",
      });
    }

    // Base query for labours
    let labourQuery = {
      role: "labour",
      work_category: contractorCategory,
    };

    // Add search filter if provided
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      labourQuery.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phoneNumber: searchRegex },
        { email: searchRegex },
      ];
    }

    let labours = await User.find(labourQuery).select(
      "-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest"
    );

    // If availability date is provided, filter labours who are available on that date
    if (availabilityDate) {
      try {
        const requestedDate = new Date(availabilityDate);
        if (isNaN(requestedDate.getTime())) {
          return res.status(400).json({
            success: false,
            status: 400,
            message: "अमान्य तिथि प्रारूप",
          });
        }

        requestedDate.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const LabourAvailability = require('../models/labourAvailabilityModel');
        const availableLabours = await LabourAvailability.find({
          availabilityDate: {
            $gte: requestedDate,
            $lte: endOfDay
          },
          status: 'active'
        }).select('labour');

        const availableLabourIds = availableLabours.map(avail => avail.labour);
        labours = labours.filter(labour => availableLabourIds.includes(labour._id.toString()));

        labours = await Promise.all(labours.map(async (labour) => {
          const availability = await LabourAvailability.findOne({
            labour: labour._id,
            availabilityDate: {
              $gte: requestedDate,
              $lte: endOfDay
            },
            status: 'active'
          }).populate('skills', 'name nameHindi category');

          return {
            ...labour.toObject(),
            availability: availability ? {
              availabilityDate: availability.availabilityDate,
              skills: availability.skills,
              location: availability.location,
              status: availability.status
            } : null
          };
        }));

      } catch (dateError) {
        console.error("Date filtering error:", dateError);
        return res.status(400).json({
          success: false,
          status: 400,
          message: "तिथि फ़िल्टरिंग में त्रुटि",
        });
      }
    }

    if (!labours || labours.length === 0) {
      return res.status(200).json({
        success: true,
        status: 200,
        message: search ? "खोज के अनुसार कोई मजदूर नहीं मिला!" : (availabilityDate ? "इस तिथि पर कोई उपलब्ध मजदूर नहीं मिला!" : "कोई मिलान करने वाला मजदूर नहीं मिला!"),
        total: 0,
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: search ? "खोज परिणाम सफलतापूर्वक प्राप्त!" : (availabilityDate ? "उपलब्ध मजदूर सफलतापूर्वक प्राप्त किए गए!" : "मिलान करने वाले मजदूर सफलतापूर्वक प्राप्त किए गए!"),
      total: labours.length,
      data: labours,
      searchQuery: search || null,
      filterApplied: availabilityDate ? {
        availabilityDate: availabilityDate,
        description: `मजदूर जो ${new Date(availabilityDate).toLocaleDateString('hi-IN')} को उपलब्ध हैं`
      } : null
    });
  } catch (error) {
    console.error("Search labours error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

const deleteLabourAccount = async (req, res) => {
  try {
    const labourId = req.user.id;
    await JobApplication.deleteMany({ labour: labourId });
    await JobPost.updateMany(
      { "acceptedLabours.labour": labourId },
      { $pull: { acceptedLabours: { labour: labourId } }, $inc: { labourersFilled: -1 } }
    );
    await LabourAvailability.deleteMany({ labour: labourId });
    await Notification.deleteMany({ recipient: labourId });
    await User.findByIdAndDelete(labourId);
    return res.status(200).json({
      success: true,
      message: "मजदूर खाता और संबंधित सभी डेटा सफलतापूर्वक हटा दिया गया।"
    });
  } catch (error) {
    console.error("Delete labour account error:", error);
    return res.status(500).json({
      success: false,
      message: "सर्वर में आंतरिक त्रुटि हुई। कृपया बाद में प्रयास करें।"
    });
  }
};

module.exports = {
  getAllUsers,
  toggleContractorAgent,
  getLabourDetailsById,
  getAllLabours,
  searchAllLabours,
  updateRoleBasisUser,
  getLoggedInUser,
  deleteUser,
  updateLocation,
  searchUsers,
  deleteMultipleUsers,
  uploadProfileImage,
  getLaboursByAgent,
  deleteLabourAccount,
  adminUpdateUser
};
