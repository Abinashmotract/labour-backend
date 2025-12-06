const JobPost = require("../../models/jobPostModel");
const Skill = require("../../models/skillModel");
const User = require("../../models/userModel");
const { sendJobNotificationToAllLabours, sendJobNotificationToNearbyLabours } = require("../../service/notificationService");
const { sendAndSaveNotification } = require("../notificationController");

// Create Job Post (Admin)
const createJobPost = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      jobTiming,
      skills,
      labourersRequired,
      validUntil,
      longitude,
      latitude
    } = req.body;
    let locationData;
    if (typeof location === 'object' && location.coordinates) {
      locationData = {
        type: "Point",
        coordinates: location.coordinates,
        address: location.address || ""
      };
    } else {
      locationData = {
        type: "Point",
        coordinates: [longitude, latitude],
        address: location
      };
    }
    if (!title || !description || !jobTiming || !labourersRequired || !validUntil) {
      return res.status(400).json({
        success: false,
        message: "सभी फ़ील्ड (शीर्षक, विवरण, नौकरी समय, आवश्यक मजदूर, वैध तक) आवश्यक हैं",
      });
    }
    if (!locationData.coordinates || locationData.coordinates.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "वैध निर्देशांक आवश्यक हैं",
      });
    }

    const jobPost = new JobPost({
      title,
      description,
      location: locationData,
      jobTiming,
      contractor: req.user.id,
      skills,
      labourersRequired,
      validUntil: new Date(validUntil),
    });

    await jobPost.save();
    
    // ✅ Populate job data for notification
    try {
      const populatedJob = await JobPost.findById(jobPost._id)
        .populate('contractor', 'firstName lastName')
        .populate('skills', 'name nameHindi');
      
      try {
        await sendJobNotificationToAllLabours(populatedJob);
        await sendJobNotificationToNearbyLabours(populatedJob, 50000); 
      } catch (notificationError) {
        console.error('Notification sending failed:', notificationError);
        // Don't fail the main request if notification fails
      }
    } catch (populateError) {
      console.error('Error populating job post:', populateError);
      // Don't fail the main request if populate fails
    }

    return res.status(201).json({
      success: true,
      message: "नौकरी पोस्ट सफलतापूर्वक बनाया गया",
      data: jobPost,
    });
  } catch (error) {
    console.error("Error in createJobPost:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};
// Get All Job Posts
const getAllJobPosts = async (req, res) => {
  try {
    const { showExpired, longitude, latitude, maxDistance = 15000 } = req.query;

    let filter = { isActive: true, isFilled: false };
    // ✅ If logged-in user is a contractor, show only their jobs
    if (req.user.role === "contractor") {
      filter.contractor = req.user.id;
    }

    if (longitude && latitude) {
      const userLongitude = parseFloat(longitude);
      const userLatitude = parseFloat(latitude);

      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLongitude, userLatitude],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }
    if (showExpired !== "true") {
      filter.validUntil = { $gt: new Date() };
    }
    const jobs = await JobPost.find(filter)
      .populate(
        "contractor",
        "firstName lastName email phoneNumber profilePicture"
      )
      .populate("skills", "name nameHindi category")
      .sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      message: "नौकरी पोस्ट सफलतापूर्वक प्राप्त",
      data: jobs,
    });
  } catch (error) {
    console.error("Error in getAllJobPosts:", error);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

const getContractorJobs = async (req, res) => {
  try {
    const { showExpired, longitude, latitude, maxDistance = 15000 } = req.query;

    // ✅ Sirf logged-in contractor ke jobs
    let filter = {
      contractor: req.user.id,  // 🔹 contractor filter add kiya
      isActive: true,
      isFilled: false
    };

    if (longitude && latitude) {
      const userLongitude = parseFloat(longitude);
      const userLatitude = parseFloat(latitude);

      filter.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [userLongitude, userLatitude],
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    if (showExpired !== "true") {
      filter.validUntil = { $gt: new Date() };
    }

    const jobs = await JobPost.find(filter)
      .populate(
        "contractor",
        "firstName lastName email phoneNumber profilePicture"
      )
      .populate("skills", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "ठेकेदार नौकरियां सफलतापूर्वक प्राप्त",
      data: jobs,
    });
  } catch (error) {
    console.error("Error in getContractorJobs:", error);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

// Update Job Post
const updateJobPost = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      location,
      jobTiming,
      skills,
      labourersRequired,
      validUntil,
      isActive,
    } = req.body;

    // Check if job post exists
    const jobPost = await JobPost.findById(id);
    if (!jobPost) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "नौकरी पोस्ट नहीं मिला",
      });
    }

    // Check if the user owns this job post
    if (jobPost.contractor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "अनधिकृत: आप केवल अपनी नौकरी पोस्ट अपडेट कर सकते हैं",
      });
    }

    // Validate labourers required if provided
    if (labourersRequired && labourersRequired < 1) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "कम से कम 1 मजदूर आवश्यक है",
      });
    }

    // Validate validUntil date if provided
    let validUntilDate;
    if (validUntil) {
      validUntilDate = new Date(validUntil);
      if (validUntilDate <= new Date()) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "वैध तिथि भविष्य में होनी चाहिए",
        });
      }
    }

    // Validate skills if provided
    if (skills && Array.isArray(skills) && skills.length > 0) {
      const validSkills = await Skill.find({ _id: { $in: skills } });
      if (validSkills.length !== skills.length) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "कुछ कौशल अमान्य हैं",
        });
      }
    }

    // Prepare update object
    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (jobTiming) updateData.jobTiming = jobTiming;
    if (skills) updateData.skills = skills;
    if (labourersRequired) updateData.labourersRequired = labourersRequired;
    if (validUntil) updateData.validUntil = validUntilDate;
    if (typeof isActive !== "undefined") updateData.isActive = isActive;

    // ✅ Handle location (coordinates + address)
    if (location) {
      updateData.location = {
        type: "Point",
        coordinates: location.coordinates || jobPost.location.coordinates,
        address: location.address || jobPost.location.address,
      };
    }

    // Update job post
    const updatedJobPost = await JobPost.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("skills", "name")
      .populate("contractor", "firstName lastName email phoneNumber");

    return res.status(200).json({
      success: true,
      status: 200,
      message: "नौकरी पोस्ट सफलतापूर्वक अपडेट",
      data: updatedJobPost,
    });
  } catch (error) {
    console.error("Error in updateJobPost:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        status: 400,
        message: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

// Delete Job Post (Soft Delete - set isActive to false)
const deleteJobPost = async (req, res) => {
  try {
    const { id } = req.params;
    const jobPost = await JobPost.findById(id);
    if (!jobPost) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "नौकरी पोस्ट नहीं मिला",
      });
    }
    if (jobPost.contractor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Unauthorized: You can only delete your own job posts",
      });
    }
    const deletedJobPost = await JobPost.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    ).populate("skills", "name");

    return res.status(200).json({
      success: true,
      status: 200,
      message: "नौकरी पोस्ट सफलतापूर्वक हटाया गया",
    });
  } catch (error) {
    console.error("Error in deleteJobPost:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

const getNearbyJobs = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 15000 } = req.query; // 15km default
    const labourId = req.user.id;
    // const labourSkills = req.user.skills || [];

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "देशांतर और अक्षांश आवश्यक हैं",
      });
    }
    const userLongitude = parseFloat(longitude);
    const userLatitude = parseFloat(latitude);
    const distance = parseInt(maxDistance);
    // Get current date for filtering valid jobs
    const currentDate = new Date();
    const nearbyJobs = await JobPost.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [userLongitude, userLatitude],
          },
          distanceField: "distance",
          maxDistance: distance,
          spherical: true,
        },
      },
      {
        $match: {
          isActive: true,
          isFilled: false,
          validUntil: { $gt: currentDate },
          // skills: { $in: labourSkills },
        },
      },
      {
        $lookup: {
          from: "skills",
          localField: "skills",
          foreignField: "_id",
          as: "skills",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "contractor",
          foreignField: "_id",
          as: "contractor",
        },
      },
      {
        $unwind: {
          path: "$contractor",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          title: 1,
          description: 1,
          location: 1,
          jobTiming: 1,
          labourersRequired: 1,
          labourersFilled: 1,
          validUntil: 1,
          skills: {
            _id: 1,
            name: 1,
          },
          contractor: {
            firstName: 1,
            lastName: 1,
            phoneNumber: 1,
          },
          distance: 1,
          createdAt: 1,
          hasApplied: {
            $in: [labourId, "$acceptedLabours.labour"],
          },
        },
      },
      {
        $sort: { distance: 1, createdAt: -1 }, // Sort by distance (nearest first) then by newest
      },
    ]);
    return res.status(200).json({
      success: true,
      message: "पास की नौकरियां सफलतापूर्वक प्राप्त",
      data: nearbyJobs,
      count: nearbyJobs.length,
    });
  } catch (error) {
    console.error("Error in getNearbyJobs:", error);
    return res.status(500).json({
      success: false,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

module.exports = {
  createJobPost,
  getAllJobPosts,
  getContractorJobs,
  updateJobPost,
  deleteJobPost,
  getNearbyJobs,
};
