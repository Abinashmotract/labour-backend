const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('../../middleware/error');
const User = require('../../models/userModel');
const Contracter = require('../../models/Contracter');
const JobApplication = require('../../models/jobApplicationModel');
const JobPost = require('../../models/jobPostModel');

// Login function
const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return next(createError(400, 'Email and password are required'));
        }
        const adminEmail = 'labour@gmail.com';
        const hashedAdminPassword = await bcrypt.hash('labourAdmin123', 10);
        if (email !== adminEmail) {
            return res.status(401).json({
                message: "Authentication failed. Invalid email or password",
                status: 401,
                success: false,
            });
        }
        const isPasswordCorrect = await bcrypt.compare(password, hashedAdminPassword);
        if (!isPasswordCorrect) {
            return res.status(401).json({
                message: "Authentication failed. Invalid email or password",
                status: 401,
                success: false,
            });
        }
        const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret';
        const token = jwt.sign({ role: 'admin' }, jwtSecret, { expiresIn: '7d' });

        res.cookie('admin_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'development',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(200).json({
            status: 200,
            success: true,
            message: 'Admin authentication successful',
            token,
        });
    } catch (error) {
        console.error('Error in loginAdmin:', error);
        return next(createError(500, 'Internal Server Error'));
    }
};

const logoutAdmin = (req, res) => {
    try {
        res.clearCookie('admin_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
        });

        return res.status(200).json({
            status: 200,
            success: true,
            message: "Admin logged out successfully",
        });
    } catch (error) {
        console.error('Error in logoutAdmin:', error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: 'Internal Server Error',
        });
    }
};

// Helper function to format time ago
const timeAgo = (date) => {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);

    if (seconds < 60) return `${seconds} sec ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
};

// Dashboard overview function
const dashboardOverViews = async (req, res) => {
    try {
        const totalLabour = await User.countDocuments({ role: 'labour' });
        const totalContractors = await Contracter.countDocuments();
        const pendingContractorApprovals = await Contracter.countDocuments({ isApproved: false });
        const approvedContractors = await Contracter.countDocuments({ isApproved: true });
        const recentActivity = [];

        const [recentLabour, recentContractors] = await Promise.all([
            User.find({ role: 'labour' }).sort({ createdAt: -1 }).limit(3),
            Contracter.find().sort({ createdAt: -1 }).limit(3),
        ]);
        recentLabour.forEach((labour) => {
            recentActivity.push({
                type: 'labour',
                message: `New labour registration: ${labour.fullName || 'Unnamed'}`,
                time: timeAgo(labour.createdAt),
                timeRaw: labour.createdAt,
            });
        });
        recentContractors.forEach((contractor) => {
            const message = contractor.isApproved
                ? `Contractor ${contractor.fullName || 'Unnamed'} updated profile`
                : `New contractor ${contractor.fullName || 'Unnamed'} signup pending approval`;

            recentActivity.push({
                type: contractor.isApproved ? 'profile' : 'approval',
                message,
                time: timeAgo(contractor.updatedAt),
                timeRaw: contractor.updatedAt,
            });
        });
        recentActivity.sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw));
        const cleanedRecentActivity = recentActivity.map(({ timeRaw, ...rest }) => rest);

        // Get contractor acceptances for labour requests
        const contractorAcceptances = await JobApplication.find({ status: 'accepted' })
            .populate({
                path: 'job',
                populate: {
                    path: 'contractor',
                    select: 'firstName lastName email phoneNumber'
                }
            })
            .populate('labour', 'firstName lastName email phoneNumber')
            .sort({ updatedAt: -1 })
            .limit(10)
            .lean();

        const contractorAcceptanceData = contractorAcceptances.map(app => ({
            labourName: `${app.labour?.firstName || ''} ${app.labour?.lastName || ''}`.trim() || 'Unknown',
            labourEmail: app.labour?.email || 'N/A',
            labourPhone: app.labour?.phoneNumber || 'N/A',
            contractorName: `${app.job?.contractor?.firstName || ''} ${app.job?.contractor?.lastName || ''}`.trim() || 'Unknown',
            contractorEmail: app.job?.contractor?.email || 'N/A',
            contractorPhone: app.job?.contractor?.phoneNumber || 'N/A',
            jobTitle: app.job?.title || 'N/A',
            acceptedAt: app.updatedAt,
            acceptedAtFormatted: timeAgo(app.updatedAt),
        }));

        // Get accepted labours for contractor job posts
        const contractorJobPosts = await JobPost.find({ contractor: { $exists: true, $ne: null } })
            .populate('contractor', 'firstName lastName email phoneNumber')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        const contractorJobData = [];
        for (const job of contractorJobPosts) {
            const acceptedApplications = await JobApplication.find({
                job: job._id,
                status: 'accepted'
            })
                .populate('labour', 'firstName lastName email phoneNumber')
                .lean();

            if (acceptedApplications.length > 0) {
                contractorJobData.push({
                    jobTitle: job.title || 'N/A',
                    contractorName: `${job.contractor?.firstName || ''} ${job.contractor?.lastName || ''}`.trim() || 'Unknown',
                    contractorEmail: job.contractor?.email || 'N/A',
                    contractorPhone: job.contractor?.phoneNumber || 'N/A',
                    labourersRequired: job.labourersRequired || 0,
                    labourersFilled: job.labourersFilled || 0,
                    acceptedLaboursCount: acceptedApplications.length,
                    acceptedLabours: acceptedApplications.map(app => ({
                        labourName: `${app.labour?.firstName || ''} ${app.labour?.lastName || ''}`.trim() || 'Unknown',
                        labourEmail: app.labour?.email || 'N/A',
                        labourPhone: app.labour?.phoneNumber || 'N/A',
                        acceptedAt: app.updatedAt,
                        acceptedAtFormatted: timeAgo(app.updatedAt),
                    })),
                    createdAt: job.createdAt,
                });
            }
        }

        return res.status(200).json({
            status: 200,
            success: true,
            data: {
                totalLabour,
                totalContractors,
                pendingContractorApprovals,
                approvedContractors,
                recentActivity: cleanedRecentActivity,
                contractorAcceptances: contractorAcceptanceData,
                contractorJobAcceptances: contractorJobData,
            },
        });

    } catch (error) {
        console.error("Error in dashboardOverViews:", error);
        return res.status(500).json({
            status: 500,
            success: false,
            message: "Internal Server Error",
        });
    }
};

// Create user by Admin (labour/contractor)
const adminCreateUser = async (req, res, next) => {
    try {
        const { firstName, lastName, email, phoneNumber, role } = req.body;
        
        // Validate required fields (email is optional)
        if (!firstName || !firstName.trim()) {
            return next(createError(400, "First name is required"));
        }
        if (!lastName || !lastName.trim()) {
            return next(createError(400, "Last name is required"));
        }
        if (!phoneNumber || !phoneNumber.trim()) {
            return next(createError(400, "Phone number is required"));
        }
        if (!role) {
            return next(createError(400, "Role is required"));
        }
        
        if (!["labour", "contractor"].includes(role)) {
            return next(createError(400, "Invalid role. Must be 'labour' or 'contractor'"));
        }
        
        // Validate phone number format (basic validation)
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(phoneNumber.trim())) {
            return next(createError(400, "Phone number must be 10 digits"));
        }
        
        // Validate email format if provided (email is optional)
        if (email && email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.trim())) {
                return next(createError(400, "Invalid email format"));
            }
        }
        
        let user = await User.findOne({ phoneNumber });
        const otp = "888888";
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        if (user) {
            user.firstName = firstName.trim();
            user.lastName = lastName.trim();
            if (email && email.trim()) {
                user.email = email.toLowerCase().trim();
            }
            user.role = role;
            user.otp = otp;
            user.otpExpiry = otpExpiry;
            if (role === "contractor") {
                user.isAgent = false;
            }
        } else {
            user = new User({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email && email.trim() ? email.toLowerCase().trim() : undefined,
                phoneNumber: phoneNumber.trim(),
                role,
                otp,
                otpExpiry,
                isPhoneVerified: false,
                createdByAdmin: true,
                isAgent: role === "contractor" ? false : undefined,
            });
        }
        await user.save();
        return res.status(200).json({
            success: true,
            message: `User ${user._id} created/updated by admin. OTP sent for verification`,
            data: {
                userId: user._id,
                phoneNumber: user.phoneNumber
            }
        });
    } catch (error) {
        console.error("Error in adminCreateUser:", error);
        return next(createError(500, "Internal Server Error"));
    }
};

module.exports = {
    loginAdmin,
    logoutAdmin,
    dashboardOverViews,
    adminCreateUser
};
