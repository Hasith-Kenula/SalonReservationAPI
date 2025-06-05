const { text } = require("body-parser");
const textflow = require("textflow.js");
textflow.useKey(
  "fKul2Sp55eRI0cUSy876bh0nAC213hGTOVdoDQBvc2PkBNwnuc0nFVISqdqDXVUJ"
);
const otpStore = {};

// exports.sendOTP = async (req, res) => {
//   console.log(`Sending otp ${req.body.phone}`);
//   const { phone } = req.body;
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();
//   console.log(`OTP: ${otp}`);
//   otpStore[phone] = otp;

//   try {
//     await client.messages.create({
//       body: `Your OTP is ${otp}`,
//       from: process.env.TWILIO_PHONE_NUMBER,
//       to: phone,
//     });
//     res.status(200).json({
//       success: true,
//       message: "OTP sent successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to send OTP",
//     });
//   }
// };

// exports.verifyOTP = async (req, res) => {
//   console.log(`Sending otp ${req.body.phone}----${req.body.otp}`);
//   const { phone, otp } = req.body;
//   const validOTP = otpStore[phone];

//   if (otp === validOTP) {
//     delete otpStore[phone];
//     res.status(200).json({
//       success: true,
//       message: "OTP verified successfully",
//     });
//   } else {
//     res.status(401).json({
//       success: false,
//       message: "Invalid OTP",
//     });
//   }
// };
exports.sendOTP = async (req, res) => {
  const { phone } = req.body;
  const result = await textflow.sendVerificationSMS(phone);
  res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: result,
  });
};

exports.verifyOTP = async (req, res) => {};
