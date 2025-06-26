const md5 = require("crypto-js/md5");
const crypto = require("crypto-js");

const merchant_id = "1230814";
const merchant_secret = "Mjg3OTA2NDQ5OTI2MTk2NTk1MjgzMDQ5OTgzOTk5NjUzNjgwODEz";
// const merchant_secret = "NjQ4NzAxMTUwODk2MTAxMDk0MTI2NzAwNTY0Mjk2ODQ2OTYxMg==";
const currency = "LKR";
const country = "Sri Lanka";
exports.payReservation = (req, res) => {
  try {
    console.log("-----------Making Payment Details----------------");
    const {
      order_id,
      items,
      amount,
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
    } = req.body;
    let amountFormated = parseFloat(amount)
      .toLocaleString("en-us", { minimumFractionDigits: 2 })
      .replaceAll(",", "");
    console.log(`Formatted amount: ${amountFormated}`);
    let hashedSecret = md5(merchant_secret).toString().toUpperCase();
    console.log(`HashedSecrect: ${hashedSecret}`);
    const hash = md5(
      merchant_id + order_id + amountFormated + currency + hashedSecret
    )
      .toString()
      .toUpperCase();
    console.log(`Final hash: ${hash}`);
    const paymentData = {
      merchant_id,
      return_url:
        "https://salonreservationapi.up.railway.app/payments/payment-success",
      cancel_url:
        "https://salonreservationapi.up.railway.app/payments/payment-cancel",
      notify_url:
        "https://salonreservationapi.up.railway.app/payments/payhere/notify",
      order_id,
      items,
      amount: amountFormated,
      currency,
      first_name,
      last_name,
      email,
      phone,
      address,
      country,
      city,
      hash,
    };

    res.json(paymentData);
  } catch (error) {
    console.log(error);
  }
};

exports.payhereNotify = (req, res) => {
  console.log("payhere notify");
  const {
    merchant_id,
    order_id,
    payhere_amount,
    payhere_currency,
    status_code,
    md5sig,
  } = req.body;

  const localSig = md5(
    merchant_id +
      order_id +
      payhere_amount +
      payhere_currency +
      status_code +
      md5(merchant_secret).toString().toUpperCase()
  )
    .toString()
    .toUpperCase();

  if (localSig === md5sig) {
    // ✅ Valid payment
    // Update DB with order_id = paid
    console.log("Payment verified: ", order_id);
    res.status(200).json({
      message: `Payment verified: ${order_id}`,
    });
  } else {
    // ❌ Invalid signature
    console.log("Signature mismatch");
    res.status(200).json({
      message: `Signature mismatch`,
    });
  }

  res.sendStatus(200);
};

exports.success = (req, res) => {
  console.log("Payment successfull");
  res.status(200).json({
    message: "Payment successfull",
  });
};
exports.cancel = (req, res) => {
  console.log("Payment cancel");
  res.status(500).json({
    message: "Payment cancel",
  });
};
