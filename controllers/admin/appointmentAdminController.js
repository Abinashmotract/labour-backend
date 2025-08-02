const Appointment = require("../../models/appointmentModel");
const User = require("../../models/userModel");
const Stylist = require("../../models/hairStylistModel");
const { sendEmail } = require("../../service/emailService");
const { sendNotification } = require("../../service/notificationService");

// Get all appointments (with optional filters)
const getAllAppointments = async (req, res) => {
    try {
        const { status, userId, stylistId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (userId) filter.user = userId;
        if (stylistId) filter.stylist = stylistId;

        const appointments = await Appointment.find(filter)
            .populate('user', 'fullName email')
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
            message: 'All appointments fetched successfully',
            data: updatedAppointments
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            status: 500,
            message: error.message
        });
    }
};

// Update appointment status
const updateAppointmentStatus = async (req, res) => {
    try {
        const stylistId = req.user.id;
        const { appointmentId } = req.params;
        const { status } = req.body;
        const allowedStatuses = ['pending', 'confirmed', 'cancelled', 'completed'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ success: false, status: 400, message: 'Invalid status value' });
        }
        // const appointment = await Appointment.findOne({ _id: appointmentId, stylist: stylistId });
        const appointment = await Appointment.findOne({ _id: appointmentId, stylist: stylistId })
            .populate('service', 'name').populate('subService', 'name');
        if (!appointment) {
            return res.status(404).json({ success: false, status: 404, message: 'Appointment not found or not authorized' });
        }
        appointment.status = status;
        await appointment.save();

        // Send email to user if confirmed or cancelled
        if (status === 'confirmed' || status === 'cancelled') {
            try {
                const user = await User.findById(appointment.user);
                const stylist = await Stylist.findById(stylistId);

                if (user?.deviceToken) {
                    const notifTitle = status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Cancelled';
                    const message = `Your appointment on ${appointment.date} at ${slotTime} has been ${status} by ${stylist?.fullName || 'stylist'}.`;

                    await sendNotification(user.deviceToken, notifTitle, message, user._id);
                }

                const serviceName = appointment.service?.name || appointment.service || '';
                const subServiceName = appointment.subService?.name || appointment.subService || '';
                // Try to get service and subservice names if possible
                try {
                    const Service = require("../models/serviceCategoryModel");
                    const SubService = require("../models/subServiceModel");
                    const service = await Service.findById(appointment.service);
                    if (service) serviceName = service.name;
                    if (appointment.subService) {
                        const subService = await SubService.findById(appointment.subService);
                        if (subService) subServiceName = subService.name;
                    }
                } catch (e) { }
                // Format slot time to AM/PM
                function formatTime(time) {
                    const [h, m] = time.split(':');
                    let hour = parseInt(h);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    hour = hour % 12 || 12;
                    return `${hour}:${m} ${ampm}`;
                }
                const slotTime = `${formatTime(appointment.slot.from)} - ${formatTime(appointment.slot.till)}`;
                const intro = `<div style='max-width:600px;margin:40px auto 0 auto;text-align:center;font-family:Segoe UI,Arial,sans-serif;'><p style='font-size:1.1rem;color:#4a4e69;margin-bottom:24px;'>Braid On Call is your trusted platform for connecting clients with professional hair stylists for in-home and in-salon services. We are dedicated to providing a seamless, reliable, and high-quality experience for both clients and stylists. Thank you for being a valued part of our community!</p></div>`;
                const subject = status === 'confirmed' ? 'Appointment Confirmed' : 'Appointment Cancelled';
                const body = `
                  ${intro}
                  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,0.07);font-family:'Segoe UI',Arial,sans-serif;overflow:hidden;display:block;">
                    <div style="background:#22223b;padding:24px 0;text-align:center;">
                      <img src="cid:projectlogo" alt="Braid On Call Logo" style="height:60px;max-width:180px;object-fit:contain;"/>
                    </div>
                    <div style="padding:32px 24px 24px 24px;">
                      <h2 style="color:#22223b;margin:0 0 12px 0;font-size:1.5rem;">Appointment ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
                      <p style="color:#4a4e69;font-size:1.1rem;margin:0 0 18px 0;">Hello <b>${user.fullName || ''}</b>,<br>Your appointment has been <b>${status}</b> by stylist <b>${stylist.fullName || ''}</b>. Here are the details:</p>
                      <table style="width:100%;border-collapse:collapse;font-size:1rem;color:#22223b;margin-bottom:18px;">
                        <tr><td style="padding:6px 0;font-weight:600;">Date:</td><td>${appointment.date}</td></tr>
                        <tr><td style="padding:6px 0;font-weight:600;">Slot:</td><td>${slotTime}</td></tr>
                        <tr><td style="padding:6px 0;font-weight:600;">Service:</td><td>${serviceName}${appointment.subService ? ' - ' + subServiceName : ''}</td></tr>
                      </table>
                    </div>
                    <div style="background:#f2e9e4;padding:18px 0;text-align:center;color:#4a4e69;font-size:0.95rem;">Braid On Call &copy; ${new Date().getFullYear()}</div>
                  </div>
                `;
                if (user.email) {
                    await sendEmail(null, user.email, subject, body, [{ filename: 'logo.png', path: require('path').join(__dirname, '../../logo.png'), cid: 'projectlogo' }]);
                }
            } catch (e) {
                console.error('Failed to send user notification email:', e);
            }
        }

        return res.status(200).json({ success: true, status: 200, message: 'Appointment status updated', data: appointment });
    } catch (error) {
        return res.status(500).json({ success: false, status: 500, message: error.message });
    }
}

module.exports = { getAllAppointments, updateAppointmentStatus }; 