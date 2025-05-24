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
const getServiceByID = async (serviceID) => {
  try {
    const query = "SELECT * FROM service WHERE serviceID = ?";
    const [rows] = await db.query(query, [serviceID]);
    return rows.length > 0 ? rows[0] : false;
  } catch (error) {
    console.log(error);
  }
};
exports.getSalonServices = async (req, res) => {
  const { salonID } = req.params;
  console.log(`----------ferching services by salon (${salonID})----------`);
  try {
    const query = "SELECT * FROM service WHERE salonID = ?";
    const [result] = await db.query(query, [salonID]);
    if (result.length > 0) {
      console.log([result]);
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
      const newService = await getServiceByID(serviceID);
      if (newService) {
        res.status(201).json({
          success: true,
          message: "Service created successfully",
          data: newService,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Newly created service not found",
        });
      }
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
exports.delete = async (req, res) => {
  const { serviceID } = req.params;
  console.log(
    `----------------Deleting a service (${serviceID})----------------`
  );
  try {
    const query = "DELETE FROM service WHERE serviceID = ?";
    const [result] = await db.query(query, [serviceID]);
    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Service deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Server error!",
    });
  }
};
exports.update = async (req, res) => {
  console.log(
    `-----------------------Updating Service (${req.params.serviceID}) by Salon (${req.body.salonID})-----------------------`
  );
  const { serviceID } = req.params;
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
      console.log(
        `Service(${serviceID}) updated successfully by salon (${req.body.salonID})`
      );
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to update service",
      });
    }
  } catch (error) {}
};
