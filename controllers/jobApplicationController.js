const JobApplication = require("../models/jobApplicationModel");
const JobPost = require("../models/jobPostModel");
const User = require("../models/userModel"); 

// Apply for a job (labour side)
const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const labourId = req.user.id;

    const job = await JobPost.findById(jobId).populate(
      "contractor",
      "firstName lastName email phoneNumber"
    );
    if (!job) {
      return res
        .status(404)
        .json({ success: false, status: 404, message: "Job not found" });
    }
    if (!job.isActive) {
      return res
        .status(400)
        .json({
          success: false,
          status: 400,
          message: "Job is no longer active",
        });
    }
    if (job.isFilled) {
      return res
        .status(400)
        .json({
          success: false,
          status: 400,
          message: "Job is already filled",
        });
    }

    // Check if already applied
    const existing = await JobApplication.findOne({
      job: jobId,
      labour: labourId,
    });
    if (existing) {
      return res
        .status(400)
        .json({
          success: false,
          status: 400,
          message: "Already applied for this job",
        });
    }

    // Save the application
    const application = new JobApplication({
      job: jobId,
      labour: labourId,
      coverLetter,
      status: "accepted",
    });
    await application.save();

    job.labourersFilled += 1;
    job.acceptedLabours.push({
      labour: labourId,
      acceptedAt: new Date(),
    });
    if (job.labourersFilled >= job.labourersRequired) job.isFilled = true;
    await job.save();
    
    // Send notifications
    const labour = await User.findById(labourId);
    const contractor = job.contractor;

    const jobDate = new Date(job.jobTiming);
    const formattedDate = jobDate.toDateString();

    // Labour notification
    if (labour.fcmToken) {
      await sendNotification(
        labour.fcmToken,
        "Job Applied Successfully",
        `You are accepted for job "${job.title}" on ${formattedDate}.`
      );
    }

    // Contractor notification
    if (contractor.fcmToken) {
      await sendNotification(
        contractor.fcmToken,
        "New Labour Accepted",
        `${labour.firstName} ${labour.lastName} accepted for your job "${job.title}" on ${formattedDate}.`
      );
    }

    application.notificationsSent = true;
    await application.save();


    return res.status(201).json({
      success: true,
      status: 201,
      message: "Job application submitted successfully, emails sent",
    });
  } catch (err) {
    console.error("Error in applyJob:", err);
    return res
      .status(500)
      .json({ success: false, status: 500, message: "Internal Server Error" });
  }
};

// Get applications of logged-in labour
const myApplications = async (req, res) => {
  try {
    const labourId = req.user.id;
    const applications = await JobApplication.find({ labour: labourId })
      .populate({
        path: "job",
        select:
          "title description location jobTiming labourersRequired labourersFilled isFilled skills contractor",
        populate: [
          { path: "skills", select: "name" },
          { path: "contractor", select: "firstName lastName email phoneNumber" }
        ],
      })
      .sort({ createdAt: -1 });
    const history = applications.map(app => {
      if (!app.job) {
        return {
          applicationId: app._id,
          status: app.status,
          appliedAt: app.createdAt,
          coverLetter: app.coverLetter || "",
          job: null
        };
      }

      return {
        applicationId: app._id,
        status: app.status,
        appliedAt: app.createdAt,
        coverLetter: app.coverLetter || "",
        job: {
          jobId: app.job._id,
          title: app.job.title,
          description: app.job.description,
          location: app.job.location,
          jobTiming: app.job.jobTiming,
          labourersRequired: app.job.labourersRequired,
          labourersFilled: app.job.labourersFilled,
          isFilled: app.job.isFilled,
          skills: app.job.skills?.map(s => s.name) || [],
          contractor: app.job.contractor
            ? {
                id: app.job.contractor._id,
                firstName: app.job.contractor.firstName,
                lastName: app.job.contractor.lastName,
                email: app.job.contractor.email,
                phoneNumber: app.job.contractor.phoneNumber
              }
            : null
        }
      };
    });

    return res.status(200).json({
      success: true,
      message: "Job applications fetched successfully",
      data: history
    });
  } catch (err) {
    console.error("Error in myApplications:", err);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
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
        select:
          "title description location jobTiming labourersRequired labourersFilled isFilled",
      })
      .populate("labour", "firstName lastName phoneNumber email skills")
      .sort({ createdAt: -1 });

    const filtered = applications.filter((app) => app.job !== null);

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
    const application = await JobApplication.findById(applicationId)
      .populate({
        path: "job",
        populate: { path: "contractor", select: "firstName lastName" },
      })
      .populate("labour", "firstName lastName");
    if (!application) {
      return res
        .status(404)
        .json({
          success: false,
          status: 404,
          message: "Application not found",
        });
    }
    // Check authorization
    if (application.job.contractor._id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ success: false, status: 403, message: "Not authorized" });
    }
    // Prevent changing already finalized applications
    if (
      application.status === "accepted" ||
      application.status === "rejected"
    ) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: `Application is already ${application.status}`,
      });
    }
    const job = await JobPost.findById(application.job._id);
    if (status === "accepted") {
      if (job.isFilled || job.labourersFilled >= job.labourersRequired) {
        return res.status(400).json({
          success: false,
          message: "Job is already filled",
        });
      }
    }
    // Update status
    application.status = status;
    await application.save();
    if (status === "accepted") {
      job.labourersFilled += 1;
      job.acceptedLabours.push({
        labour: application.labour._id,
        acceptedAt: new Date(),
      });
      if (job.labourersFilled >= job.labourersRequired) job.isFilled = true;
      await job.save();
    }
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
          isFilled: job.isFilled,
        },
      },
    });
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

// Contractor: Get job post with labour count details
const getJobLabourStats = async (req, res) => {
  try {
    const contractorId = req.user.id;
    const { jobId } = req.params;

    const job = await JobPost.findOne({
      _id: jobId,
      contractor: contractorId,
    }).select(
      "title labourersRequired labourersFilled isFilled acceptedLabours"
    );

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found or unauthorized",
      });
    }

    // Get accepted applications count
    const acceptedApplications = await JobApplication.countDocuments({
      job: jobId,
      status: "accepted",
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
          acceptedLaboursCount: job.acceptedLabours.length,
        },
        applications: {
          accepted: acceptedApplications,
        },
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
  // sendJobNotifications,
  myApplications,
  getJobApplicationsForContractor,
  updateApplicationStatus,
  getJobLabourStats,
};
