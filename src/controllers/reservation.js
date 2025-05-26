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
    console.log(
      `-------------------Making a new reservation ${resID}-------------------`
    );
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
        const io = req.app.get("io");
        const getNewReservation = `
            SELECT
                r.resID,
                r.resDate,
                r.resTime,
                r.customerID,
                r.resStatus,
                r.salonID,
                c.fullName AS customerName,
                c.phone AS customerPhone,
                GROUP_CONCAT(sv.serviceName) AS reservedServices,
                SUM(sv.servicePrice) AS totalPrice
              FROM reservation r
              JOIN customer c ON r.customerID = c.customerID
              JOIN reservation_service rs ON r.resID = rs.resID
              JOIN service sv ON rs.serviceID = sv.serviceID
              WHERE r.resID = ? AND r.resStatus = 'pending'
              GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, c.fullName, c.phone
              ORDER BY r.resDate, r.resTime
            `;
        const [newReservations] = await db.query(getNewReservation, [resID]);
        if (newReservations.length > 0) {
          console.log({
            Data: newReservations[0],
          });

          io.to(`salon_${salonID}`).emit("reservation:new", {
            resID: newReservations[0].resID,
            resDate: newReservations[0].resDate,
            resTime: newReservations[0].resTime,
            resStatus: newReservations[0].resStatus,
            customerName: newReservations[0].customerName,
            customerPhone: newReservations[0].customerPhone,
            reservedServices: newReservations[0].reservedServices,
            totalPrice: newReservations[0].totalPrice,
            salonID: newReservations[0].salonID,
          });
          res.status(201).json({
            success: true,
            message: "successfull",
            data: {
              success: true,
              data: newReservations[0],
            },
          });
        }
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
ORDER BY r.resDate ASC, r.resTime ASC`;
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

exports.getReservationsBySalonID = async (req, res) => {
  console.log(
    `-------------------getReservationsBySalonID (${req.params.salonID})----------------`
  );
  try {
    const { salonID } = req.params;
    const query = `SELECT
  r.resID,
  r.resDate,
  r.customerID,
  r.resTime,
  r.resStatus,
  c.fullName AS customerName,
  c.phone AS customerPhone,
  GROUP_CONCAT(sv.serviceName) AS reservedServices,
  SUM(sv.servicePrice) AS totalPrice
FROM reservation r
JOIN customer c ON r.customerID = c.customerID
JOIN reservation_service rs ON r.resID = rs.resID
JOIN service sv ON rs.serviceID = sv.serviceID
WHERE r.salonID = ? AND r.resStatus = 'pending'
GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, c.fullName, c.phone
ORDER BY r.resDate ASC, r.resTime ASC`;
    const [rows] = await db.query(query, [salonID]);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "successfull",
        data: rows,
      });
      console.log(
        "Successfully fetched reservation data for salonID: " + salonID
      );
    } else {
      res.status(404).json({
        success: false,
        message: "No reservations found for salonID: " + salonID,
      });
      console.log("No reservations found for salonID: " + salonID);
    }
  } catch (error) {
    return returnServerErrorMessage(res, error);
  }
};

exports.updateStatus = async (req, res) => {
  console.log(
    `-------------------updateStatus (${req.params.resID})----------------`
  );
  try {
    const { resID } = req.params;
    const { resStatus } = req.body;
    const { salonID } = req.body;
    const io = req.app.get("io");
    const query = `UPDATE reservation SET resStatus = ? WHERE resID = ?`;
    const [result] = await db.query(query, [resStatus, resID]);
    if (result.affectedRows > 0) {
      const updatedReservationQuery = `
      SELECT
      r.resID,
      r.resDate,
      r.customerID,
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
      WHERE r.resID = ?
      GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, s.salonName, s.phone
      ORDER BY r.resDate ASC, r.resTime ASC
    `;
      const [updatedRows] = await db.query(updatedReservationQuery, [resID]);
      if (updatedRows.length > 0) {
        const customerID = updatedRows[0].customerID;
        console.log("checking customerID: " + customerID);
        io.to(`customer_${customerID}`).emit("reservation:statusUpdate", {
          resID: updatedRows[0].resID,
          resDate: updatedRows[0].resDate,
          resTime: updatedRows[0].resTime,
          customerName: updatedRows[0].customerName,
          customerPhone: updatedRows[0].customerPhone,
          reservedServices: updatedRows[0].reservedServices,
          totalPrice: updatedRows[0].totalPrice,
          salonName: updatedRows[0].salonName,
          salonPhone: updatedRows[0].salonPhone,
          resStatus: updatedRows[0].resStatus,
        });
        io.to(`salon_${salonID}`).emit("reservation:statusUpdate", {
          resID: updatedRows[0].resID,
          resDate: updatedRows[0].resDate,
          resTime: updatedRows[0].resTime,
          customerName: updatedRows[0].customerName,
          customerPhone: updatedRows[0].customerPhone,
          reservedServices: updatedRows[0].reservedServices,
          totalPrice: updatedRows[0].totalPrice,
          salonName: updatedRows[0].salonName,
          salonPhone: updatedRows[0].salonPhone,
          resStatus: updatedRows[0].resStatus,
        });
        res.status(200).json({
          success: true,
          message: "Reservation status updated successfully",
        });
        console.log("Updated reservation data: ", updatedRows[0]);
      } else {
        console.log("No updated reservation data found for resID: " + resID);
      }

      console.log("Reservation status updated successfully");
    } else {
      res.status(404).json({
        success: false,
        message: "No reservation found with resID: " + resID,
      });
      console.log("No reservation found with resID: " + resID);
    }
  } catch (error) {
    return returnServerErrorMessage(res, error);
  }
};
