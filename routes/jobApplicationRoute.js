// routes/jobApplicationRoute.js
const express = require("express");
const router = express.Router();
const { verifyAllToken } = require("../middleware/verifyToken");
const { applyJob, myApplications, getJobApplicationsForContractor, updateApplicationStatus } = require("../controllers/jobApplicationController");

// labour applies for a job
router.post("/apply/:jobId", verifyAllToken(["labour"]), applyJob);

// get logged-in labour applications
router.get("/my-applications", verifyAllToken(["labour"]), myApplications);

// Contractor Routes
router.get("/contractor/applications", verifyAllToken(["contractor"]), getJobApplicationsForContractor);
router.patch("/contractor/application/:applicationId", verifyAllToken(["contractor"]), updateApplicationStatus);

module.exports = router;
