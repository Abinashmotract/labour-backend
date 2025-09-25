const express = require("express");
const router = express.Router();
const { verifyAllToken } = require("../../middleware/verifyToken");
const { createJobPost, getAllJobPosts, updateJobPost, deleteJobPost, getNearbyJobs, getContractorJobs } = require("../../controllers/admin/jobPostController");

// Contractor can create job post
router.post("/job-posts", verifyAllToken(["contractor"]), createJobPost);
router.put("/update-job-posts/:id", verifyAllToken(["contractor"]), updateJobPost);
router.delete("/delete-job-posts/:id", verifyAllToken(["contractor"]), deleteJobPost); 
router.get("/nearby-jobs", verifyAllToken(["labour", "admin"]), getNearbyJobs);

router.get("/all-contractor-jobs", verifyAllToken(["contractor"]), getContractorJobs);

// Get all job posts (public / labour can see)
router.get("/all-jobs", verifyAllToken(["contractor"]), getAllJobPosts);

module.exports = router;
