const JobPost = require("../../models/jobPostModel");
const Skill = require("../../models/skillModel");

// Create Job Post
const createJobPost = async (req, res) => {
  try {
    const { title, description, location, budget, skills } = req.body;

    // validation
    if (!title || !description || !location || !budget) {
      return res.status(400).json({
        success: false,
        message: "All fields (title, description, location, budget) are required",
      });
    }

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one skill is required",
      });
    }

    // check skills exist in DB
    const validSkills = await Skill.find({ _id: { $in: skills }, isActive: true });
    if (validSkills.length !== skills.length) {
      return res.status(400).json({
        success: false,
        message: "Some skills are invalid or inactive",
      });
    }

    const jobPost = new JobPost({
      title,
      description,
      location,
      budget,
      contractor: req.user.id, // contractor id from JWT
      skills,
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
    const jobs = await JobPost.find()
      .populate("contractor", "fullName email")
      .populate("skills", "name");

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

module.exports = { createJobPost, getAllJobPosts };
