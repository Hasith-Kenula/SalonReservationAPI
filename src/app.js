const express = require("express");
const bodyParser = require("body-parser");

//routers
const reservationRoutes = require("./routes/reservation");
const salonRoutes = require("./routes/salon");
const customerRoutes = require("./routes/customer");
const servicesRoutes = require("./routes/service");

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

app.use("/reservations", reservationRoutes);
app.use("/salons", salonRoutes);
app.use("/customers", customerRoutes);
app.use("/services", servicesRoutes);

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
