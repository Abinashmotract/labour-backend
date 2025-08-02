const nodemailer = require("nodemailer");
const validator = require('validator');

const sendEmail = async (fromUserEmail, to, subject, text, attachments) => {
    try {
        // Email validation
        if (!validator.isEmail(to)) {
            throw new Error("Invalid email format");
        }

        const mailTransporter = nodemailer.createTransport({
            service: "GMAIL",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailDetails = {
            from: process.env.SMTP_USER,
            to: to,
            subject: subject,
            html: text,
            ...(fromUserEmail && { replyTo: fromUserEmail }),
            ...(attachments ? { attachments } : {})
        };

        await mailTransporter.sendMail(mailDetails);
        console.log("Email sent successfully!");
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};


module.exports = {
    sendEmail
}