// controllers/jobApplicationController.js
const JobApplication = require("../models/jobApplicationModel");
const JobPost = require("../models/jobPostModel");

// Apply for a job (labour side)
const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const labourId = req.user.id;

    // check job exists
    const job = await JobPost.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // check if already applied
    const existing = await JobApplication.findOne({ job: jobId, labour: labourId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already applied for this job" });
    }

    const application = new JobApplication({
      job: jobId,
      labour: labourId,
      coverLetter,
    });

    await application.save();

    return res.status(201).json({
      success: true,
      message: "Job application submitted successfully",
      data: application,
    });
  } catch (err) {
    console.error("Error in applyJob:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get applications of logged-in labour
const myApplications = async (req, res) => {
  try {
    const labourId = req.user.id;

    const applications = await JobApplication.find({ labour: labourId })
      .populate("job", "title description location budget skills");

    return res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      data: applications,
    });
  } catch (err) {
    console.error("Error in myApplications:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Contractor: Get applications for their job
const getJobApplicationsForContractor = async (req, res) => {
  try {
    const contractorId = req.user.id; // contractor from token

    const applications = await JobApplication.find()
      .populate({
        path: "job",
        match: { contractor: contractorId },
        select: "title description budget location",
      })
      .populate("labour", "firstName lastName phoneNumber email");

    // filter out null jobs (not posted by this contractor)
    const filtered = applications.filter(app => app.job !== null);

    return res.status(200).json({
      success: true,
      message: "Applications fetched successfully",
      data: filtered,
    });
  } catch (error) {
    console.error("Error in getJobApplicationsForContractor:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// Contractor: Accept/Reject Application
const updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be 'accepted' or 'rejected'",
      });
    }

    const application = await JobApplication.findById(applicationId).populate("job");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    // Only the contractor who owns the job can update
    if (application.job.contractor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this application",
      });
    }

    application.status = status;
    await application.save();

    return res.status(200).json({
      success: true,
      message: `Application ${status} successfully`,
      data: application,
    });
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = { applyJob, myApplications, getJobApplicationsForContractor, updateApplicationStatus };
