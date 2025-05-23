const db = require("../bd");

const { v4: uuidv4 } = require("uuid");

// for create unique id for service
const generateID = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = uuidv4().replace(/-/g, "").substring(0, 8);
    const [rows] = await db.query("SELECT * FROM service WHERE serviceID = ?", [
      id,
    ]);
    exists = rows.length > 0;
  }
  return id;
};
exports.getAll = async (req, res) => {
  console.log("----------ferching all services----------");
  try {
    const query = "SELECT * FROM service";
    const [result] = await db.query(query);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Services retrieved successfully",
        data: result,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No data found",
      });
    }
  } catch (error) {}
};

exports.create = async (req, res) => {
  console.log("----------------Adding a service----------------");
  try {
    const { salonID, serviceName, servicePrice, durationMinutes } = req.body;
    const serviceID = await generateID();
    const query =
      "INSERT INTO service(serviceID, salonID, serviceName, servicePrice, durationMinutes) VALUES(?,?,?,?,?)";
    const [result] = await db.query(query, [
      serviceID,
      salonID,
      serviceName,
      servicePrice,
      durationMinutes,
    ]);
    if (result.affectedRows > 0) {
      res.status(201).json({
        success: true,
        message: "Service created successfully",
        data: result,
      });
      console.log("Service created successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create service",
      });
      console.log("Failed to create service");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  const serviceID = req.params;
  const { serviceName, servicePrice, durationMinutes } = req.body;
  try {
    const query =
      "UPDATE service SET serviceName = ?, servicePrice = ?, durationMinutes = ? WHERE serviceID=?";
    const [result] = await db.query(query, [
      serviceName,
      servicePrice,
      durationMinutes,
      serviceID,
    ]);
    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Service updated successfully",
        data: result,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to update service",
      });
    }
  } catch (error) {}
};
