const JobApplication = require("../models/jobApplicationModel");
const JobPost = require("../models/jobPostModel");
const { sendEmail } = require("../service/emailService");

// Apply for a job (labour side)
const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const labourId = req.user.id;

    // Check if job exists and is active
    const job = await JobPost.findById(jobId).populate("contractor", "firstName lastName email phoneNumber");
    if (!job) {
      return res.status(404).json({ success: false, status: 404, message: "Job not found" });
    }
    if (!job.isActive) {
      return res.status(400).json({ success: false, status: 400, message: "Job is no longer active" });
    }
    if (job.isFilled) {
      return res.status(400).json({ success: false, status: 400, message: "Job is already filled" });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({ job: jobId, labour: labourId });
    if (existing) {
      return res.status(400).json({ success: false, status: 400, message: "Already applied for this job" });
    }

    // Save the application
    const application = new JobApplication({
      job: jobId,
      labour: labourId,
      coverLetter,
    });
    await application.save();

    // Send emails
    try {
      // 1️⃣ Email to contractor
      if (job.contractor?.email) {
        await sendEmail(
          null, // replyTo
          job.contractor.email,
          `New Job Application for "${job.title}"`,
          `<p>Hello ${job.contractor.firstName},</p>
           <p>${req.user.firstName || 'A labour'} has applied for your job "${job.title}".</p>
           <p>Cover Letter: ${coverLetter || 'N/A'}</p>
           <p>Check your dashboard to review applications.</p>`
        );
      }

      // 2️⃣ Email to labour (confirmation)
      await sendEmail(
        null,
        req.user.email,
        `Application Submitted for "${job.title}"`,
        `<p>Hello ${req.user.firstName || 'Labour'},</p>
         <p>Your application for the job "${job.title}" has been submitted successfully.</p>
         <p>Contractor: ${job.contractor?.firstName || ''} ${job.contractor?.lastName || ''}</p>
         <p>Job Location: ${job.location}</p>
         <p>Thank you for applying!</p>`
      );
    } catch (emailErr) {
      console.error("Error sending application emails:", emailErr);
    }

    return res.status(201).json({
      success: true,
      status: 201,
      message: "Job application submitted successfully, emails sent",
    });
  } catch (err) {
    console.error("Error in applyJob:", err);
    return res.status(500).json({ success: false, status: 500, message: "Internal Server Error" });
  }
};

// Get applications of logged-in labour
const myApplications = async (req, res) => {
  try {
    const labourId = req.user.id;
    const applications = await JobApplication.find({ labour: labourId })
      .populate({
        path: "job",
        select: "title description location jobTiming labourersRequired labourersFilled isFilled validUntil skills",
        populate: {
          path: "skills",
          select: "name"
        }
      });

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
    const contractorId = req.user.id;

    const applications = await JobApplication.find()
      .populate({
        path: "job",
        match: { contractor: contractorId },
        select: "title description location jobTiming labourersRequired labourersFilled isFilled",
      })
      .populate("labour", "firstName lastName phoneNumber email skills")
      .sort({ createdAt: -1 });

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
        status: 400,
        message: "Invalid status. Must be 'accepted' or 'rejected'",
      });
    }

    const application = await JobApplication.findById(applicationId).populate({
      path: "job",
      populate: { path: "contractor", select: "firstName lastName email" }
    }).populate("labour", "firstName lastName email");
    
    if (!application) {
      return res.status(404).json({
        success: false,
        status: 404,
        message: "Application not found",
      });
    }

    // Check authorization
    if (application.job.contractor._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: "You are not authorized to update this application",
      });
    }

    // Prevent changing already finalized applications
    if (application.status === 'accepted' || application.status === 'rejected') {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Application is already ${application.status}`,
      });
    }

    const job = await JobPost.findById(application.job._id);

    // Accepting checks
    if (status === 'accepted') {
      if (job.isFilled || job.labourersFilled >= job.labourersRequired) {
        return res.status(400).json({
          success: false,
          status: 400,
          message: "Job is already filled, cannot accept more applications",
        });
      }
    }

    // Update application status
    application.status = status;
    await application.save();

    // Update job if accepted
    if (status === 'accepted') {
      job.labourersFilled += 1;
      job.acceptedLabours.push({
        labour: application.labour._id,
        acceptedAt: new Date()
      });
      if (job.labourersFilled >= job.labourersRequired) job.isFilled = true;
      await job.save();
    }

    // Send email to labourer
    try {
      if (application.labour.email) {
        await sendEmail(
          null,
          application.labour.email,
          `Your application for "${job.title}" has been ${status}`,
          `<p>Hello ${application.labour.firstName},</p>
           <p>Your application for the job "${job.title}" has been <strong>${status}</strong> by the contractor.</p>
           <p>Job Location: ${job.location}</p>
           <p>Contractor: ${job.contractor.firstName} ${job.contractor.lastName}</p>`
        );
      }
    } catch (emailErr) {
      console.error("Error sending status email:", emailErr);
    }

    // Populate updated application for response
    const updatedApplication = await JobApplication.findById(applicationId)
      .populate("job", "title labourersRequired labourersFilled isFilled")
      .populate("labour", "firstName lastName");

    return res.status(200).json({
      success: true,
      status: 200,
      message: `Application ${status} successfully`,
      data: {
        application: updatedApplication,
        jobStatus: {
          labourersRequired: job.labourersRequired,
          labourersFilled: job.labourersFilled,
          isFilled: job.isFilled
        }
      },
    });

  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "Internal Server Error",
    });
  }
};

// Contractor: Get job post with labour count details
const getJobLabourStats = async (req, res) => {
  try {
    const contractorId = req.user.id;
    const { jobId } = req.params;

    const job = await JobPost.findOne({ _id: jobId, contractor: contractorId })
      .select("title labourersRequired labourersFilled isFilled acceptedLabours");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    // Get accepted applications count
    const acceptedApplications = await JobApplication.countDocuments({
      job: jobId,
      status: 'accepted'
    });

    return res.status(200).json({
      success: true,
      message: "Job labour stats fetched successfully",
      data: {
        job: {
          title: job.title,
          labourersRequired: job.labourersRequired,
          labourersFilled: job.labourersFilled,
          isFilled: job.isFilled,
          acceptedLaboursCount: job.acceptedLabours.length
        },
        applications: {
          accepted: acceptedApplications
        }
      },
    });
  } catch (error) {
    console.error("Error in getJobLabourStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  applyJob,
  myApplications,
  getJobApplicationsForContractor,
  updateApplicationStatus,
  getJobLabourStats
};