const Skill = require("../../models/skillModel");

// Create skill
const createSkill = async (req, res) => {
  try {
    const { name, nameHindi, category } = req.body;

    if (!name || !nameHindi || !category) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "कौशल नाम, हिंदी नाम और श्रेणी आवश्यक हैं",
      });
    }

    // normalize incoming name and log for debugging
    const normalizedName = name.toLowerCase().trim();
    console.log(`createSkill: received name='${name}' normalized='${normalizedName}'`);

    const existingSkill = await Skill.findOne({ name: normalizedName });

    if (existingSkill) {
      // log details about the matching skill to help debug duplicate detection
      try {
        console.log("createSkill: existingSkill found:", {
          id: existingSkill._id?.toString(),
          name: existingSkill.name,
          nameHindi: existingSkill.nameHindi,
          category: existingSkill.category,
        });
      } catch (logErr) {
        console.warn("createSkill: failed to log existingSkill details", logErr);
      }
    }

    if (existingSkill) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "इस नाम के साथ कौशल पहले से मौजूद है",
      });
    }

    const skill = new Skill({
      name: name.toLowerCase().trim(),
      nameHindi: nameHindi.trim(),
      category: category.trim(),
    });

    await skill.save();

    return res.status(201).json({
      success: true,
      status: 201,
      message: "कौशल सफलतापूर्वक बनाया गया",
      data: {
        id: skill._id,
        name: skill.name,
        nameHindi: skill.nameHindi,
        category: skill.category,
        isActive: skill.isActive,
        createdAt: skill.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in createSkill:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
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
      message: "कौशल सफलतापूर्वक प्राप्त",
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
      message: "आंतरिक सर्वर त्रुटि",
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
        message: "कौशल नहीं मिला",
      });
    }

    return res.status(200).json({
      success: true,
      status: 200,
      message: "कौशल सफलतापूर्वक प्राप्त",
      data: skill,
    });
  } catch (error) {
    console.error("Error in getSkillById:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
    });
  }
};

// Update skill
const updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, nameHindi, category, isActive } = req.body;

    const skill = await Skill.findById(id);

    if (!skill) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "कौशल नहीं मिला",
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
          message: "इस नाम के साथ कौशल पहले से मौजूद है",
        });
      }
    }

    // Update fields
    if (name !== undefined) skill.name = name.toLowerCase().trim();
    if (nameHindi !== undefined) skill.nameHindi = nameHindi.trim();
    if (category !== undefined) skill.category = category.trim();
    if (isActive !== undefined) skill.isActive = isActive;

    await skill.save();

    return res.status(200).json({
      success: true,
      status: 200,
      message: "कौशल सफलतापूर्वक अपडेट",
      data: {
        id: skill._id,
        name: skill.name,
        nameHindi: skill.nameHindi,
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
      message: "आंतरिक सर्वर त्रुटि",
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
        message: "कौशल नहीं मिला",
      });
    }

    await Skill.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "कौशल सफलतापूर्वक हटाया गया",
    });
  } catch (error) {
    console.error("Error in deleteSkill:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "आंतरिक सर्वर त्रुटि",
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
        message: "skillIds सरणी आवश्यक है",
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
      message: "आंतरिक सर्वर त्रुटि",
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
        message: "कौशल नहीं मिला",
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
      message: "आंतरिक सर्वर त्रुटि",
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
