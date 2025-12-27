const JobApplication = require("../models/jobApplicationModel");
const JobPost = require("../models/jobPostModel");
const User = require("../models/userModel"); 
const { sendNotification } = require("../utils/notifications");

// Get logo URL
const getLogoUrl = () => {
  // Use environment variable or default based on NODE_ENV
  let baseUrl = process.env.BASE_URL || process.env.API_BASE_URL;
  if (!baseUrl) {
    baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://nearbylabour.com' 
      : 'http://localhost:3512';
  }
  // Remove /api if present in baseUrl
  baseUrl = baseUrl.replace(/\/api$/, '');
  return `${baseUrl}/images/loginpagelogo.jpeg`;
};

// Apply for a job (labour side)
const applyJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { coverLetter } = req.body;
    const labourId = req.user.id;

    const job = await JobPost.findById(jobId).populate(
      "contractor",
      "firstName lastName email phoneNumber fcmToken"
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
      status: "pending",
    });
    await application.save();
    
    // Send notifications
    const labour = await User.findById(labourId);
    const contractor = job.contractor;

    // Format date properly
    let formattedDate = "";
    if (job.jobTiming) {
      const jobDate = new Date(job.jobTiming);
      if (!isNaN(jobDate.getTime())) {
        // Format date in Hindi format: DD/MM/YYYY
        const day = String(jobDate.getDate()).padStart(2, '0');
        const month = String(jobDate.getMonth() + 1).padStart(2, '0');
        const year = jobDate.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
    }

    // Labour notification
    if (labour.fcmToken) {
      const labourName = `${labour.firstName || ""} ${labour.lastName || ""}`.trim();
      let message = "";
      if (labourName) {
        message = formattedDate 
          ? `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को सफलतापूर्वक जमा कर दिया गया है।`
          : `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन सफलतापूर्वक जमा कर दिया गया है।`;
      } else {
        message = formattedDate 
          ? `"${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को सफलतापूर्वक जमा कर दिया गया है।`
          : `"${job.title}" नौकरी के लिए आपका आवेदन सफलतापूर्वक जमा कर दिया गया है।`;
      }
      await sendNotification(
        labour.fcmToken,
        "आवेदन जमा किया गया",
        message,
        getLogoUrl()
      );
    }

    // Contractor notification
    if (contractor.fcmToken) {
      const message = formattedDate 
        ? `${labour.firstName} ${labour.lastName} ने आपकी नौकरी "${job.title}" के लिए ${formattedDate} को आवेदन किया है।`
        : `${labour.firstName} ${labour.lastName} ने आपकी नौकरी "${job.title}" के लिए आवेदन किया है।`;
      await sendNotification(
        contractor.fcmToken,
        "नया नौकरी आवेदन",
        message,
        getLogoUrl()
      );
    }

    application.notificationsSent = true;
    await application.save();


    return res.status(201).json({
      success: true,
      status: 201,
      message: "Job application submitted successfully",
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
    
    const job = await JobPost.findById(application.job._id);
    const previousStatus = application.status;
    
    // Handle status change from accepted to rejected or vice versa
    if (previousStatus === "accepted" && status === "rejected") {
      // Remove from accepted count
      if (job.labourersFilled > 0) {
        job.labourersFilled -= 1;
      }
      // Remove from acceptedLabours array
      job.acceptedLabours = job.acceptedLabours.filter(
        (labour) => labour.labour.toString() !== application.labour._id.toString()
      );
      // Update isFilled status
      if (job.isFilled && job.labourersFilled < job.labourersRequired) {
        job.isFilled = false;
      }
      await job.save();
    } else if (previousStatus === "rejected" && status === "accepted") {
      // Check if job can accept more labours
      if (job.isFilled || job.labourersFilled >= job.labourersRequired) {
        return res.status(400).json({
          success: false,
          message: "Job is already filled",
        });
      }
      // Add to accepted count
      job.labourersFilled += 1;
      // Check if this labour is already in acceptedLabours
      const alreadyAccepted = job.acceptedLabours.some(
        (labour) => labour.labour.toString() === application.labour._id.toString()
      );
      if (!alreadyAccepted) {
        job.acceptedLabours.push({
          labour: application.labour._id,
          acceptedAt: new Date(),
        });
      }
      if (job.labourersFilled >= job.labourersRequired) {
        job.isFilled = true;
      }
      await job.save();
    } else if (previousStatus === "pending" && status === "accepted") {
      // Check if job can accept more labours
      if (job.isFilled || job.labourersFilled >= job.labourersRequired) {
        return res.status(400).json({
          success: false,
          message: "Job is already filled",
        });
      }
      // Add to accepted count
      job.labourersFilled += 1;
      job.acceptedLabours.push({
        labour: application.labour._id,
        acceptedAt: new Date(),
      });
      if (job.labourersFilled >= job.labourersRequired) {
        job.isFilled = true;
      }
      await job.save();
    }
    
    // Update status
    application.status = status;
    await application.save();
    
    // Send notifications to labour
    const labour = await User.findById(application.labour._id);
    
    // Get labour name
    const labourName = labour 
      ? `${labour.firstName || ""} ${labour.lastName || ""}`.trim() 
      : "";
    
    // Format date properly
    let formattedDate = "";
    if (job.jobTiming) {
      const jobDate = new Date(job.jobTiming);
      if (!isNaN(jobDate.getTime())) {
        // Format date in Hindi format: DD/MM/YYYY
        const day = String(jobDate.getDate()).padStart(2, '0');
        const month = String(jobDate.getMonth() + 1).padStart(2, '0');
        const year = jobDate.getFullYear();
        formattedDate = `${day}/${month}/${year}`;
      }
    }
    
    if (status === "accepted") {
      if (labour && labour.fcmToken) {
        let message = "";
        if (labourName) {
          message = formattedDate 
            ? `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को स्वीकार कर लिया गया है। 🎉`
            : `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन स्वीकार कर लिया गया है। 🎉`;
        } else {
          message = formattedDate 
            ? `"${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को स्वीकार कर लिया गया है। 🎉`
            : `"${job.title}" नौकरी के लिए आपका आवेदन स्वीकार कर लिया गया है। 🎉`;
        }
        await sendNotification(
          labour.fcmToken,
          "आवेदन स्वीकार किया गया! 🎉",
          message,
          getLogoUrl()
        );
      }
    } else if (status === "rejected") {
      if (labour && labour.fcmToken) {
        let message = "";
        if (labourName) {
          message = formattedDate 
            ? `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को अस्वीकार कर दिया गया है।`
            : `${labourName}, "${job.title}" नौकरी के लिए आपका आवेदन अस्वीकार कर दिया गया है।`;
        } else {
          message = formattedDate 
            ? `"${job.title}" नौकरी के लिए आपका आवेदन ${formattedDate} को अस्वीकार कर दिया गया है।`
            : `"${job.title}" नौकरी के लिए आपका आवेदन अस्वीकार कर दिया गया है।`;
        }
        await sendNotification(
          labour.fcmToken,
          "आवेदन स्थिति अपडेट",
          message,
          getLogoUrl()
        );
      }
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

// Contractor: Dashboard job stats
const getContractorJobStats = async (req, res) => {
  try {
    const contractorId = req.user.id;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Fetch all jobs created by contractor
    const totalJobs = await JobPost.countDocuments({ contractor: contractorId });

    // In-progress jobs → active, not filled, and still valid
    const inProgress = await JobPost.countDocuments({
      contractor: contractorId,
      isActive: true,
      isFilled: false,
      validUntil: { $gte: new Date() },
    });
    const completed = await JobPost.countDocuments({
      contractor: contractorId,
      $or: [
        { isFilled: true },
        { validUntil: { $lt: new Date() } },
      ],
    });
    const todayRequested = await JobPost.countDocuments({
      contractor: contractorId,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    return res.status(200).json({
      success: true,
      message: "Contractor job stats fetched successfully",
      data: {
        totalJobs,
        inProgress,
        completed,
        todayRequested,
      },
    });
  } catch (error) {
    console.error("Error in getContractorJobStats:", error);
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
  getContractorJobStats
};
