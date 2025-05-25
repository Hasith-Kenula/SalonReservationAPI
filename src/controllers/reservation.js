const { json } = require("body-parser");
const db = require("../bd");
const { v4: uuidv4 } = require("uuid");

// const generateID = (salonID, customerID) => {
//   const resID = `${salonID}-${customerID}-${uuidv4()
//     .replace(/-/g, "")
//     .substring(0, 8)}`;

//   const query = "SELECT * FROM `reservations` WHERE `resID` = ?";

//   const [result] = db.query(query, resID);
//   if (result.length > 0) {
//     return generateID(salonID, customerID);
//   }
//   return resID;
// };
const returnServerErrorMessage = (res, error) => {
  console.log("Internal Server Error" + error);
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
const generateID = async (salonID, customerID) => {
  let id;
  let exists = true;
  while (exists) {
    id = `${salonID}-${customerID}-${uuidv4()
      .replace(/-/g, "")
      .substring(0, 8)}`;
    const [rows] = await db.query("SELECT * FROM reservation WHERE resID = ?", [
      id,
    ]);
    exists = rows.length > 0;
  }
  return id;
};
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM reservation");
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "All reservations retrieved successfully",
        data: rows,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No reservations found",
      });
    }
  } catch (err) {
    return returnServerErrorMessage(res, err);
  }
};

exports.getSpecific = async (req, res) => {
  try {
    const { resID } = req.params;
    const [rows] = await db.query(`SELECT * FROM reservation WHERE resID =?`, [
      resID,
    ]);

    res.status(200).json({
      Message: "successfull",
      Data: rows[0],
    });
  } catch (err) {
    return returnServerErrorMessage(res, err);
  }
};
//make a new reservation
exports.reserve = async (req, res) => {
  try {
    const { salonID, customerID, resDate, resTime, resServices } = req.body;
    console.log(resServices);
    const resID = await generateID(salonID, customerID);
    if (!Array.isArray(resServices) || resServices.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one service",
      });
    }
    const query =
      "INSERT INTO reservation(resID, salonID,customerID, resDate, resTime, resStatus) VALUES(?,?,?,?,?,?)";
    const [rows] = await db.query(query, [
      resID,
      salonID,
      customerID,
      resDate,
      resTime,
      "pending",
    ]);
    if (rows.affectedRows > 0) {
      const query2 =
        "INSERT INTO reservation_service(resID, serviceID) VALUES ?";
      const values = resServices.map((service) => [resID, service.serviceID]);
      console.log("Values: " + values);
      const [rows2] = await db.query(query2, [values]);
      if (rows2.affectedRows > 0) {
        res.status(201).json({
          success: true,
          message: "successfull",
          data: {
            resID: resID,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to add services to reservation",
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to create reservation",
      });
    }
  } catch (err) {
    return returnServerErrorMessage(res, err);
  }
};

exports.getReservationsByCustomerID = async (req, res) => {
  console.log(
    `-------------------getReservationsByCustomerID (${req.params.customerID})----------------`
  );
  try {
    const { customerID } = req.params;
    const query = `SELECT
  r.resID,
  r.resDate,
  r.resTime,
  r.resStatus,
  s.salonName,
  s.phone AS salonPhone,
  GROUP_CONCAT(sv.serviceName) AS reservedServices,
  SUM(sv.servicePrice) AS totalPrice
FROM reservation r
JOIN salon s ON r.salonID = s.salonID
JOIN reservation_service rs ON r.resID = rs.resID
JOIN service sv ON rs.serviceID = sv.serviceID
WHERE r.customerID = ?
GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, s.salonName, s.phone
ORDER BY r.resDate DESC, r.resTime DESC`;
    const [rows] = await db.query(query, [customerID]);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "successfull",
        data: rows,
      });
      console.log(
        "Successfully fetched reservation data for customerID: " + customerID
      );
    } else {
      res.status(404).json({
        success: false,
        message: "No reservations found for customerID: " + customerID,
      });
      console.log("No reservations found for customerID: " + customerID);
    }
  } catch (error) {
    return returnServerErrorMessage(res, err);
  }
};
exports.delete = async (req, res) => {
  console.log(
    `-------------------delete reservation (${req.params.resID})----------------`
  );
  try {
    const { resID } = req.params;
    const query = `DELETE FROM reservation WHERE resID = ?`;
    const [result] = await db.query(query, [resID]);
    if (result.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Reservation deleted successfully",
      });
      console.log("Reservation deleted successfully");
    } else {
      res.status(404).json({
        success: false,
        message: "No reservation found with resID: " + resID,
      });
      console.log("No reservation found with resID: " + resID);
    }
  } catch (error) {
    return returnServerErrorMessage(res, err);
  }
};
