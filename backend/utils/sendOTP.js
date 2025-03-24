const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your OTP for Password Reset",
        text: `Use this OTP to reset your password: ${otp}. It is valid for 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("OTP sent successfully");
    } catch (error) {
        console.error("Error sending OTP email:", error);
    }
};

module.exports = sendOTP;
