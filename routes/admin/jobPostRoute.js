const express = require("express");
const router = express.Router();
const { verifyAllToken } = require("../../middleware/verifyToken");
const { createJobPost, getAllJobPosts } = require("../../controllers/admin/jobPostController");

// Contractor can create job post
router.post("/job-posts", verifyAllToken(["contractor"]), createJobPost);

// Get all job posts (public / labour can see)
router.get("/all-jobs", getAllJobPosts);

module.exports = router;
