const Skill = require("../../models/skillModel");

// Create skill
const createSkill = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Skill name is required",
      });
    }

    const existingSkill = await Skill.findOne({
      name: name.toLowerCase().trim(),
    });

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Skill with this name already exists",
      });
    }

    const skill = new Skill({
      name: name.toLowerCase().trim(),
    });

    await skill.save();

    return res.status(201).json({
      success: true,
      status: 201,
      message: "Skill created successfully",
      data: {
        id: skill._id,
        name: skill.name,
        isActive: skill.isActive,
        createdAt: skill.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in createSkill:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};
// Get all skills
const getAllSkills = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, isActive } = req.query;

    const query = {};

    // Search by name
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    // Filter by isActive
    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }

    const skills = await Skill.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * parseInt(limit))
      .limit(parseInt(limit));

    const total = await Skill.countDocuments(query);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Skills fetched successfully",
      data: {
        skills,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      },
    });
  } catch (error) {
    console.error("Error in getAllSkills:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Get skill by ID
const getSkillById = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id).populate(
      "createdBy",
      "fullName email"
    );

    if (!skill) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Skill not found",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Skill fetched successfully",
      data: skill,
    });
  } catch (error) {
    console.error("Error in getSkillById:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, isActive } = req.body;

    const skill = await Skill.findById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Skill not found",
      });
    }

    // Check if name is being updated and if it already exists
    if (name && name.toLowerCase().trim() !== skill.name) {
      const existingSkill = await Skill.findOne({
        name: name.toLowerCase().trim(),
        _id: { $ne: id },
      });

      if (existingSkill) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "Skill with this name already exists",
        });
      }
    }

    // Update fields
    if (name !== undefined) skill.name = name.toLowerCase().trim();
    if (description !== undefined) skill.description = description;
    if (category !== undefined) skill.category = category;
    if (isActive !== undefined) skill.isActive = isActive;

    await skill.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Skill updated successfully",
      data: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        category: skill.category,
        isActive: skill.isActive,
        updatedAt: skill.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error in updateSkill:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Delete skill
const deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Skill not found",
      });
    }

    await Skill.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "Skill deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteSkill:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Delete multiple skills
const deleteMultipleSkills = async (req, res) => {
  try {
    const { skillIds } = req.body;

    if (!skillIds || !Array.isArray(skillIds) || skillIds.length === 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "skillIds array is required",
      });
    }

    const result = await Skill.deleteMany({
      _id: { $in: skillIds },
    });

    return res.status(200).json({
      success: true,
      status: 200,
      message: `${result.deletedCount} skill(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error in deleteMultipleSkills:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Toggle skill status
const toggleSkillStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const skill = await Skill.findById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Skill not found",
      });
    }

    skill.isActive = !skill.isActive;
    await skill.save();

    const statusMessage = skill.isActive ? "activated" : "deactivated";

    return res.status(200).json({
      success: true,
      status: 200,
      message: `Skill ${statusMessage} successfully`,
      data: {
        id: skill._id,
        name: skill.name,
        isActive: skill.isActive,
      },
    });
  } catch (error) {
    console.error("Error in toggleSkillStatus:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  createSkill,
  getAllSkills,
  getSkillById,
  updateSkill,
  deleteSkill,
  deleteMultipleSkills,
  toggleSkillStatus,
};