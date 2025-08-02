const User = require("../models/userModel");
const Stylist = require("../models/hairStylistModel");
const mongoose = require("mongoose");
const Appointment = require("../models/appointmentModel");
const { sendEmail } = require("../service/emailService");
const { sendNotification } = require("../service/notificationService");
const StylistAvailability = require("../models/stylistAvailabilityModel");

// get users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "user" })
            .select("-password -refreshToken -location -favorites -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");
        if (!users) {
            return res.status(200).json({
                success: true,
                status: 200,
                message: "No Users found!",
                data: users
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Users fetched successfully!",
            data: users
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

const updateUserDetails = async (req, res) => {
    try {
        const { userId, ...rest } = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "User ID is required",
            });
        }
        if (rest.email) {
            delete rest.email;
        }
        const updatedUser = await User.findByIdAndUpdate(userId, rest, {
            new: true,
            runValidators: true,
        }).select("-password -refreshToken -otp -otpAttempts -otpFailedAttempts");
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found",
            });
        }
        return res.status(200).json({
            success: true,
            status: 200,
            message: "User details updated successfully",
            data: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message,
        });
    }
};

// get user by id
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id)
            .select("-password -refreshToken -favorites -otp -otpAttempts -otpFailedAttempts -lastOtpRequest");
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }
        res.status(200).json({
            success: true,
            status: 200,
            message: "User fetched successfully!",
            data: user
        })
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        })
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const updateData = req.body;
        const updatedUser = await User.findByIdAndUpdate(id,
            { $set: updateData },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not updated!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "User updated succcesfully!",
            data: updatedUser
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// delete user
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findByIdAndDelete(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "User deleted successfully!"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// PATCH /api/users/location
const updateLocation = async (req, res) => {
    try {
        const { longitude, latitude } = req.body;

        await User.findByIdAndUpdate(req.user.id, {
            location: {
                type: "Point",
                coordinates: [longitude, latitude],
                lastUpdated: new Date()
            }
        });

        res.status(200).json({ success: true, status: 200, message: "Location Updated!" });
    } catch (err) {
        res.status(500).json({ success: false, status: 500, message: err.message });
    }
};

// user search
const searchUsers = async (req, res) => {
    try {
        const {
            query,
            role,
            location,
            minRating,
            maxRating,
            date,  // 👈 added
            sortBy = 'createdAt',
            sortOrder = 'desc',
            page = 1,
            limit = 10
        } = req.query;

        const searchQuery = {};

        // 🔍 Text search: name or email
        if (query) {
            searchQuery.$or = [
                { fullName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
            ];
        }

        // 🎭 Role filter
        if (role) {
            searchQuery.role = role;
        }

        // 📍 Location filter
        if (location) {
            searchQuery['location.city'] = { $regex: location, $options: 'i' };
        }

        // ⭐ Rating filter
        if (minRating || maxRating) {
            searchQuery.rating = {};
            if (minRating) searchQuery.rating.$gte = Number(minRating);
            if (maxRating) searchQuery.rating.$lte = Number(maxRating);
        }

        // 📅 Date filter (exact date match - full day)
        if (date) {
            const selectedDate = new Date(date);
            const nextDate = new Date(date);
            nextDate.setDate(selectedDate.getDate() + 1);
            searchQuery.createdAt = {
                $gte: selectedDate,
                $lt: nextDate
            };
        }

        // ⏱️ Sorting
        const sortOptions = {};
        const validSortFields = ['rating', 'lastLogin', 'createdAt'];
        if (validSortFields.includes(sortBy)) {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        } else {
            sortOptions['createdAt'] = -1;
        }

        // 📄 Pagination
        const skip = (Number(page) - 1) * Number(limit);

        const users = await User.find(searchQuery)
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit))
            .select('-password -refreshToken -otp -otpAttempts -otpFailedAttempts -lastOtpRequest')
            .lean();

        const total = await User.countDocuments(searchQuery);

        res.json({
            success: true,
            status: 200,
            message: "Search results successful!",
            count: users.length,
            total,
            page: Number(page),
            pages: Math.ceil(total / limit),
            users
        });

    } catch (error) {
        console.error('User search error:', error);
        res.status(500).json({
            success: false,
            status: 500,
            message: 'Search failed',
            error: error.message
        });
    }
};

// search stylists, services, products


// filter for stylists

// multiple delete users
const deleteMultipleUsers = async (req, res) => {
    try {
        const { userIds } = req.body;

        // Validate input
        if (!userIds || !Array.isArray(userIds)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'User IDs array is required'
            });
        }

        // Check if all IDs are valid
        const invalidIds = userIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: 'Invalid user IDs',
                invalidIds
            });
        }

        // Perform deletion
        const result = await User.deleteMany({
            _id: { $in: userIds },
            role: { $ne: 'stylist' } // Prevent deleting admins (optional)
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: 'No users found to delete'
            });
        }

        res.json({
            success: true,
            status: 200,
            message: `${result.deletedCount} users deleted successfully`,
            deletedCount: result.deletedCount
        });

    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete users',
            error: error.message
        });
    }
};

// upload profile image
const uploadProfileImage = async (req, res) => {
    try {
        const id = req.query.id ? req.query.id : req.user.id;
        const fileUrl = req.fileLocations;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        user.profileImage = fileUrl || " ";
        await user.save();

        res.status(200).json({
            success: true,
            status: 200,
            message: "Profile image uploaded successfully!"
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// Add favorites
const addFavourites = async (req, res) => {
    try {
        const userId = req.user.id;
        const { stylistId } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        if (user.favorites.includes(stylistId)) {
            return res.status(400).json({
                success: false,
                status: 400,
                message: "Stylist already in favorites!"
            });
        }

        user.favorites.append(stylistId);
        await user.save();

        return res.status(200).json({
            success: true,
            status: 200,
            message: "Stylist added to favorites successfully",
            data: user.favorites
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// delete favourites
const deleteFavourites = async (req, res) => {
    try {
        const userId = req.user.id;
        const stylistId = req.params.id;

        const stylist = await Stylist.findById(stylistId);
        if (!stylist) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "Stylist not found!"
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        user.favorites.delete(stylistId);
        await user.save();

        res.status(200).json({
            success: true,
            status: 200,
            message: "Favorites removed successfully!",
            data: user.favorites
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// get favorites
const getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                status: 404,
                message: "User not found!"
            });
        }

        res.status(200).json({
            success: true,
            status: 200,
            message: "Favorites fetched successfully!",
            data: user.favorites
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// ------------Appointment Management----------
const appointmentManagement = async (req, res) => {
    try {
        const userId = req.user.id;
        const { stylistId, serviceId, subServiceId, date, slot, notes } = req.body;

        // Validate required fields
        if (!stylistId || !serviceId || !date || !slot || !slot.from || !slot.till) {
            return res.status(400).json({
                success: false,
                message: "stylistId, serviceId, date, slot.from, and slot.till are required"
            });
        }

        // Check stylist exists
        const stylist = await Stylist.findById(stylistId);
        if (!stylist) {
            return res.status(404).json({ success: false, message: "Stylist not found" });
        }

        // Check stylist availability for the date and slot

        const availability = await StylistAvailability.findOne({ stylistId, date, isActive: true });
        if (!availability) {
            return res.status(400).json({ success: false, message: "Stylist not available on this date" });
        }
        const slotAvailable = availability.slots.some(s => s.from === slot.from && s.till === slot.till);
        if (!slotAvailable) {
            return res.status(400).json({ success: false, message: "Requested slot not available" });
        }

        // Check if slot is already booked
        const existing = await Appointment.findOne({ stylist: stylistId, date, "slot.from": slot.from, "slot.till": slot.till, status: { $in: ["pending", "confirmed"] } });
        if (existing) {
            return res.status(409).json({ success: false, message: "Slot already booked" });
        }

        // Create appointment
        const appointment = new Appointment({
            user: userId,
            stylist: stylistId,
            service: serviceId,
            subService: subServiceId,
            date,
            slot,
            notes
        });
        await appointment.save();

        // Send notifications to user and stylist
        try {
            // Fetch user and stylist for device tokens
            const user = await User.findById(userId);
            const stylistUser = await Stylist.findById(stylistId);
            // Notification content
            const notifTitle = 'Appointment Booked';
            const notifBody = `Your appointment for ${date} at ${slot.from}-${slot.till} has been booked.`;
            // Send to user
            if (user && user.deviceToken) {
                await sendNotification(user.deviceToken, notifTitle, `You have booked an appointment with ${stylistUser?.fullName || 'stylist'} for ${date} at ${slot.from}-${slot.till}.`, user._id);
            }
            // Send to stylist
            if (stylistUser && stylistUser.deviceToken) {
                await sendNotification(stylistUser.deviceToken, notifTitle, `You have a new appointment from ${user?.fullName || user?.email || 'user'} for ${date} at ${slot.from}-${slot.till}.`, stylistUser._id);
            }
        } catch (e) {
            console.error('Failed to send notification:', e);
        }

        // Send email to stylist and user
        try {
            const user = await User.findById(userId);
            let serviceName = serviceId;
            let subServiceName = subServiceId;
            // Try to get service and subservice names if possible
            try {
                const Service = require("../models/serviceCategoryModel");
                const SubService = require("../models/subServiceModel");
                const service = await Service.findById(serviceId);
                if (service) serviceName = service.name;
                if (subServiceId) {
                    const subService = await SubService.findById(subServiceId);
                    if (subService) subServiceName = subService.name;
                }
            } catch (e) { }
            const subject = 'New Appointment Booked';
            // Format slot time to AM/PM
            function formatTime(time) {
                const [h, m] = time.split(':');
                let hour = parseInt(h);
                const ampm = hour >= 12 ? 'PM' : 'AM';
                hour = hour % 12 || 12;
                return `${hour}:${m} ${ampm}`;
            }
            const slotTime = `${formatTime(slot.from)} - ${formatTime(slot.till)}`;
            const intro = `<div style='max-width:600px;margin:40px auto 0 auto;text-align:center;font-family:Segoe UI,Arial,sans-serif;'><p style='font-size:1.1rem;color:#4a4e69;margin-bottom:24px;'>Braid On Call is your trusted platform for connecting clients with professional hair stylists for in-home and in-salon services. We are dedicated to providing a seamless, reliable, and high-quality experience for both clients and stylists. Thank you for being a valued part of our community!</p></div>`;
            const statusRow = `<tr><td style='padding:6px 0;font-weight:600;'>Status:</td><td>${appointment.status}</td></tr>`;
            const userMsg = `<div style='margin:18px 0 0 0;text-align:center;color:#4a4e69;font-size:1.05rem;'>You will receive an email from the stylist once your appointment is confirmed.</div>`;
            const warmRegards = `<div style='margin:32px auto 0 auto;text-align:center;font-family:Segoe UI,Arial,sans-serif;color:#22223b;font-size:1.05rem;'>Warm regards,<br><b>Braid On Call Team</b><br><a href='tel:+18001234567' style='color:#4a4e69;text-decoration:none;'>+1-800-123-4567</a> | <a href='https://www.braidoncall.com' style='color:#4a4e69;text-decoration:none;'>www.braidoncall.com</a></div>`;
            const body = `
                ${intro}
                <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;display:block;">
                  <div style="background:#22223b;padding:24px 0;text-align:center;">
                    <img src="cid:projectlogo" alt="Braid On Call Logo" style="height:60px;max-width:180px;object-fit:contain;"/>
                  </div>
                  <div style="padding:32px 24px 24px 24px;">
                    <h2 style="color:#22223b;margin:0 0 12px 0;font-size:1.5rem;">New Appointment Booked</h2>
                    <p style="color:#4a4e69;font-size:1.1rem;margin:0 0 18px 0;">Hello <b>${stylist.fullName || ''}</b>,<br>A new appointment has been booked. Here are the details:</p>
                    <table style="width:100%;border-collapse:collapse;font-size:1rem;color:#22223b;margin-bottom:18px;">
                      <tr><td style="padding:6px 0;font-weight:600;">User:</td><td>${user.fullName || user.email}</td></tr>
                      <tr><td style="padding:6px 0;font-weight:600;">Date:</td><td>${date}</td></tr>
                      <tr><td style="padding:6px 0;font-weight:600;">Slot:</td><td>${slotTime}</td></tr>
                      <tr><td style="padding:6px 0;font-weight:600;">Service:</td><td>${serviceName}${subServiceId ? ' - ' + subServiceName : ''}</td></tr>
                      ${notes ? `<tr><td style='padding:6px 0;font-weight:600;'>Notes:</td><td>${notes}</td></tr>` : ''}
                      ${statusRow}
                    </table>
                    ${userMsg}
                  </div>
                  <div style="background:#f2e9e4;padding:18px 0;text-align:center;color:#4a4e69;font-size:0.95rem;">Braid On Call &copy; ${new Date().getFullYear()}</div>
                </div>
                ${warmRegards}
            `;
            if (stylist.email) {
                await sendEmail(null, stylist.email, subject, body, [{ filename: 'logo.png', path: require('path').join(__dirname, '../logo.png'), cid: 'projectlogo' }]);
            }
            if (user.email) {
                await sendEmail(null, user.email, subject, body, [{ filename: 'logo.png', path: require('path').join(__dirname, '../logo.png'), cid: 'projectlogo' }]);
            }
        } catch (e) {
            console.error('Failed to send stylist notification email:', e);
        }

        return res.status(201).json({
            success: true,
            message: "Appointment booked successfully",
            data: appointment
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getAppointmentBookings = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;
        const filter = { user: userId };
        if (status) filter.status = status;
        const appointments = await Appointment.find(filter)
            .populate('stylist', 'fullName email')
            .populate('service', 'name')
            .populate('subService', 'name')
            .sort({ date: 1, 'slot.from': 1 });

        // Mark expired appointments in the response
        const now = new Date();
        const updatedAppointments = appointments.map(app => {
            const appointmentDate = new Date(app.date + 'T' + app.slot.till);
            let status = app.status;
            if ((status === 'pending' || status === 'confirmed') && appointmentDate < now) {
                status = 'expired';
            }
            return { ...app.toObject(), status };
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Appointments fetched successfully',
            data: updatedAppointments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
}

const getStylistAppointments = async (req, res) => {
    try {
        const stylistId = req.user.id;
        const { status, userId } = req.query;
        const filter = { stylist: stylistId };
        if (status) filter.status = status;
        if (userId) filter.user = userId;

        const appointments = await Appointment.find(filter)
            .populate('user', 'fullName email')
            .populate('service', 'name')
            .populate('subService', 'name')
            .sort({ date: 1, 'slot.from': 1 });

        // Mark expired appointments in the response
        const now = new Date();
        const updatedAppointments = appointments.map(app => {
            const appointmentDate = new Date(app.date + 'T' + app.slot.till);
            let status = app.status;
            if ((status === 'pending' || status === 'confirmed') && appointmentDate < now) {
                status = 'expired';
            }
            return { ...app.toObject(), status };
        });

        return res.status(200).json({
            success: true,
            status: 200,
            message: 'Stylist appointments fetched successfully',
            data: updatedAppointments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
}

module.exports = {
    getAllUsers,
    // verifyUserProfile,
    updateUserDetails,
    getUserById,
    updateUserProfile,
    deleteUser,
    updateLocation,
    searchUsers,
    deleteMultipleUsers,
    uploadProfileImage,
    addFavourites,
    deleteFavourites,
    appointmentManagement,
    getAppointmentBookings,
    getStylistAppointments
}