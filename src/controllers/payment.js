// const md5 = require("crypto-js/md5");
// const crypto = require("crypto-js");

// const merchant_id = "1230814";
// const merchant_secret = "Mjg3OTA2NDQ5OTI2MTk2NTk1MjgzMDQ5OTgzOTk5NjUzNjgwODEz";
// // const merchant_secret =
// //   "MTg4NDU4MzQxMDM1Mjk5OTQwNzcxMzc2MTI1NTA4MTk5ODMyOTQ2MQ==";
// // const merchant_secret = "MjA2ODUzNDU4MTk0OTU3OTQ2MzExODA2OTUwNzYxMDMyMjk3ODc0";
// const currency = "LKR";
// const country = "Sri Lanka";
// exports.payReservation = (req, res) => {
//   try {
//     console.log("-----------Making Payment Details----------------");
//     const {
//       order_id,
//       items,
//       amount,
//       first_name,
//       last_name,
//       email,
//       phone,
//       address,
//       city,
//     } = req.body;
//     let amountFormated = parseFloat(amount)
//       .toLocaleString("en-us", { minimumFractionDigits: 2 })
//       .replaceAll(",", "");
//     console.log(`Formatted amount: ${amountFormated}`);
//     let hashedSecret = md5(merchant_secret).toString().toUpperCase();
//     console.log(`HashedSecrect: ${hashedSecret}`);
//     const hash = md5(
//       merchant_id + order_id + amountFormated + currency + hashedSecret
//     )
//       .toString()
//       .toUpperCase();
//     console.log(`Final hash: ${hash}`);
//     const paymentData = {
//       merchant_id,
//       return_url:
//         "https://salonreservationapi.up.railway.app/payments/payment-success",
//       cancel_url:
//         "https://salonreservationapi.up.railway.app/payments/payment-cancel",
//       notify_url:
//         "https://salonreservationapi.up.railway.app/payments/payhere/notify",
//       order_id,
//       items,
//       amount: amountFormated,
//       currency,
//       first_name,
//       last_name,
//       email,
//       phone,
//       address,
//       country,
//       city,
//       hash,
//     };

//     res.json(paymentData);
//   } catch (error) {
//     console.log(error);
//   }
// };

// exports.payhereNotify = (req, res) => {
//   console.log("payhere notify");
//   const {
//     merchant_id,
//     order_id,
//     payhere_amount,
//     payhere_currency,
//     status_code,
//     md5sig,
//   } = req.body;

//   const localSig = md5(
//     merchant_id +
//       order_id +
//       payhere_amount +
//       payhere_currency +
//       status_code +
//       md5(merchant_secret).toString().toUpperCase()
//   )
//     .toString()
//     .toUpperCase();

//   if (localSig === md5sig) {
//     // ✅ Valid payment
//     // Update DB with order_id = paid
//     console.log("Payment verified: ", order_id);
//     res.status(200).json({
//       message: `Payment verified: ${order_id}`,
//     });
//   } else {
//     // ❌ Invalid signature
//     console.log("Signature mismatch");
//     res.status(200).json({
//       message: `Signature mismatch`,
//     });
//   }

//   res.sendStatus(200);
// };

// exports.success = (req, res) => {
//   console.log("Payment successfull");
//   res.status(200).json({
//     message: "Payment successfull",
//   });
// };
// exports.cancel = (req, res) => {
//   console.log("Payment cancel");
//   res.status(500).json({
//     message: "Payment cancel",
//   });
// };

exports.payReservation = async (req, res) => {
  const PUBLISHABLE_KEY =
    "pk_test_51ReFpHHK0mOzH3eWINAHHUHzgPK4q9fk7GjLUes7e9YrgRIzjva30wBXoyjWAm9FSUCbqv8u32oC4uNdn0q5M4rh00BmN9uPYP";
  const SECRET_KEY =
    "sk_test_51ReFpHHK0mOzH3eWo5cH02nmk9QYASx4OgDTO4YkJtQ3GHgWvavfMd3RDF93DuFr48wCtJ1HXvkofcUvzzCGeUF500pUrdItP5";
};
