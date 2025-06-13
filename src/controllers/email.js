const nodemailer = require("nodemailer");
const db = require("../bd");
require("dotenv").config();
const otpStore = {};

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // or 'STARTTLS'
  auth: {
    user: "hasithkenula100@gmail.com",
    pass: "whmx wusn obro wdgk",
  },
});

exports.sendOTP = async (req, res) => {
  console.log("SENDING OTP to ", req.body.email);

  const { email, passwordChange } = req.body;

  if (passwordChange) {
    const queryCustomer = `SELECT * FROM customer WHERE email = ?`;
    const queryEmployee = `SELECT * FROM employee WHERE email = ?`;
    const querySalon = `SELECT * FROM salon WHERE email = ?`;

    const [rows] = await db.query(queryCustomer, [email]);
    const [rowsEmployee] = await db.query(queryEmployee, [email]);
    const [rowsSalon] = await db.query(querySalon, [email]);

    if (
      rows.length === 0 &&
      rowsEmployee.length === 0 &&
      rowsSalon.length === 0
    ) {
      return res.status(404).json({
        success: false,
        message: "Email not found in database",
      });
    }
  }

  const otp = Math.floor(Math.random() * 900000) + 100000;
  otpStore[email] = { otp, expires: Date.now() + 500000 }; // 5 minutes
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: !passwordChange
      ? "OTP Code for Email Verification"
      : "OTP Code for Password Change",
    html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
      <h2 style="color: #4CAF50;">${
        !passwordChange ? "Email Verification" : "Password Change"
      }</h2>
      <p>Hello,</p>
      <p>Your OTP code is:</p>
      <div style="font-size: 24px; font-weight: bold; color: #000; margin: 10px 0;">
        ${otp}
      </div>
      <p>This code will expire in <strong>5 minutes</strong>.</p>
      <hr />
      <p style="font-size: 12px; color: #888;">If you did not request this, please ignore this email.</p>
    </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Error sending OTP",
    });
  }
};

exports.verifiyOTP = async (req, res) => {
  console.log("VERIFYING OTP for ", req.body.email);
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) {
    return res.status(404).json({
      success: false,
      message: "OTP not found",
    });
  }
  if (record.otp == otp) {
    if (Date.now() < record.expires) {
      res.status(200).json({
        success: true,
        message: "OTP verified successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }
    delete otpStore[email];
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid OTP",
    });
  }
};
