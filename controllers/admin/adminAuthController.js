const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('../../middleware/error');
const User = require('../../models/userModel');
const Appointment = require('../../models/appointmentModel');
const Review = require('../../models/reviewModel');
const Product = require('../../models/productModel');
const Stylist = require('../../models/hairStylistModel');

// Hardcoded admin credentials for demonstration
const adminEmail = 'stylecap@gmail.com';
const adminPassword = 'stylecap123';

// Login function
const loginAdmin = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(createError(400, 'Email and password are required'));
        }

        const adminEmail = 'bocadmin@gmail.com';
        const hashedAdminPassword = await bcrypt.hash('bocAdmin123', 10);

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


const dashboardOverViews = async (req, res) => {
    try {
        // === Stats ===
        const totalUsers = await User.countDocuments();
        const activeBookings = await Appointment.countDocuments({ status: { $in: ['pending', 'confirmed'] } });
        const completedServices = await Appointment.countDocuments({ status: 'completed' });
        const revenue = 12400; // Placeholder
        const pendingApprovals = await Stylist.countDocuments({ isApproved: false });

        // === Dynamic Recent Activity ===
        const recentActivity = [];

        const [recentBookings, updatedStylists, updatedProducts] = await Promise.all([
            Appointment.find().sort({ createdAt: -1 }).limit(3).populate("user").populate("stylist"),
            Stylist.find().sort({ updatedAt: -1 }).limit(3),
            Product.find().sort({ updatedAt: -1 }).limit(3),
        ]);

        // Add Bookings
        recentBookings.forEach((booking) => {
            recentActivity.push({
                type: 'booking',
                message: `New booking by ${booking?.user?.fullName || 'a client'}`,
                time: timeAgo(booking.createdAt),
                timeRaw: booking.createdAt,
            });
        });

        // Add Stylist Updates or Approvals
        updatedStylists.forEach((stylist) => {
            const message = stylist.isApproved
                ? `Stylist ${stylist.fullName || 'Unnamed'} updated profile`
                : `New stylist ${stylist.fullName || 'Unnamed'} signup pending approval`;

            recentActivity.push({
                type: stylist.isApproved ? 'profile' : 'approval',
                message,
                time: timeAgo(stylist.updatedAt),
                timeRaw: stylist.updatedAt,
            });
        });

        // Add Product Updates
        updatedProducts.forEach((product) => {
            recentActivity.push({
                type: 'product',
                message: `Product "${product.name || 'Unnamed'}" listing updated`,
                time: timeAgo(product.updatedAt),
                timeRaw: product.updatedAt,
            });
        });

        // Sort by actual datetime (descending)
        recentActivity.sort((a, b) => new Date(b.timeRaw) - new Date(a.timeRaw));

        // Remove raw time before sending response
        const cleanedRecentActivity = recentActivity.map(({ timeRaw, ...rest }) => rest);

        // === Send Response ===
        return res.status(200).json({
            status: 200,
            success: true,
            data: {
                totalUsers,
                activeBookings,
                completedServices,
                revenue,
                pendingApprovals,
                recentActivity: cleanedRecentActivity,
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


module.exports = {
    loginAdmin,
    logoutAdmin,
    dashboardOverViews
};
