const express = require("express");
const bodyParser = require("body-parser");
//routers
const reservationRoutes = require("./routes/reservation");
const salonRoutes = require("./routes/salon");
const customerRoutes = require("./routes/customer");
const servicesRoutes = require("./routes/service");
const employeeRoutes = require("./routes/employee");
const socketRoutes = require("./routes/socket");
const otpRoutes = require("./routes/otp");
const emailRoutes = require("./routes/email");
const salonOpenRoutes = require("./routes/salonOpening");
const passwordChangeRoutes = require("./routes/passwordChange");
const stripePayment = require("./routes/stripePayment");
const notificationRoutes = require("./routes/notification");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  if (req.method === "OPTIONS") {
    res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
    return res.status(200).json({});
  }
  next();
});
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});
// app.use("/payments", paymentRoutes);
app.use("/notification", notificationRoutes);
app.use("/stripe-payment", stripePayment);
app.use("/email", emailRoutes);
app.use("/password_change", passwordChangeRoutes);
app.use("/salon_opening_hours", salonOpenRoutes);
app.use("/otp", otpRoutes);
app.use("/reservations", reservationRoutes);
app.use("/salons", salonRoutes);
app.use("/customers", customerRoutes);
app.use("/services", servicesRoutes);
app.use("/employees", employeeRoutes); //
app.use("/socket", socketRoutes);

app.get("/test", (req, res) => {
  res.status(200).json({
    message: "Test route working",
  });
});

app.use((req, res, next) => {
  const error = new Error("Not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message,
    },
  });
});
module.exports = app;
