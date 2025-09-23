const JobPost = require("../../models/jobPostModel");
const Skill = require("../../models/skillModel");

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
        message: "All fields (title, description, jobTiming, labourersRequired, validUntil) are required",
      });
    }
    if (!locationData.coordinates || !locationData.coordinates.length === 2) {
      return res.status(400).json({
        success: false,
        message: "Valid coordinates are required",
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
    return res.status(201).json({
      success: true,
      message: "Job post created successfully",
      data: jobPost,
    });
  } catch (error) {
    console.error("Error in createJobPost:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
// Get All Job Posts
const getAllJobPosts = async (req, res) => {
  try {
    const { showExpired, longitude, latitude, maxDistance = 15000 } = req.query;
    let filter = { isActive: true, isFilled: false };
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
      message: "Job posts fetched successfully",
      data: jobs,
    });
  } catch (error) {
    console.error("Error in getAllJobPosts:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
      message: "Contractor jobs fetched successfully",
      data: jobs,
    });
  } catch (error) {
    console.error("Error in getContractorJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
        message: "Job post not found",
      });
    }

    // Check if the user owns this job post
    if (jobPost.contractor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "Unauthorized: You can only update your own job posts",
      });
    }

    // Validate labourers required if provided
    if (labourersRequired && labourersRequired < 1) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "At least 1 labourer is required",
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
          message: "Valid until date must be in the future",
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
          message: "Some skills are invalid",
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
      message: "Job post updated successfully",
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
      message: "Internal Server Error",
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
        message: "Job post not found",
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
      message: "Job post deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteJobPost:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

const getNearbyJobs = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance = 15000 } = req.query; // 15km default
    const labourId = req.user.id;
    const labourSkills = req.user.skills || [];

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
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
          skills: { $in: labourSkills },
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
          from: "labours",
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
      message: "Nearby jobs fetched successfully",
      data: nearbyJobs,
      count: nearbyJobs.length,
    });
  } catch (error) {
    console.error("Error in getNearbyJobs:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
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
