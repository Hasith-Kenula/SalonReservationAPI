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
const validateBeforeReservation = async (salonID, resDate, resTime) => {
  const date = new Date(resDate);
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  console.log(`DAY NAME : ${dayName} RES TIME: ${resTime}`);
  const queryForValidateOpeningHour = `
      SELECT * 
      FROM salon_opening_hours
      WHERE salonID = ? AND day_of_week = ? AND ? BETWEEN open_time AND close_time AND is_closed = 0
    `;
  const [openingHours] = await db.query(queryForValidateOpeningHour, [
    salonID,
    dayName,
    resTime,
  ]);
  console.log("Opening Hours: ", openingHours.length);
  if (openingHours.length === 0) {
    return {
      success: false,
      message: `Salon is closed on ${dayName} at ${resTime}. Please choose a different time.`,
    }; // Salon is closed on this day or time
  } else {
    return {
      success: true,
    };
  }
};
//make a new reservation
exports.reserve = async (req, res) => {
  try {
    const { salonID, customerID, resDate, resTime, resServices } = req.body;
    const validate_day_time = await validateBeforeReservation(
      salonID,
      resDate,
      resTime
    );
    if (validate_day_time.success === false) {
      console.log(
        `Salon is closed on ${resDate} at ${resTime}. Please choose a different time.`
      );
      return res.status(400).json({
        success: false,
        message: `${validate_day_time.message}`,
      });
    }

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
          const date = new Date();
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, "0");
          const day = date.getDate().toString().padStart(2, "0");
          if (newReservations[0].resDate == `${year}-${month}-${day}`) {
            const query = `
              SELECT 
              r.resID,
              s.salonID,
              r.resTime AS startTime,
              r.resDate,
              SUM(sr.durationMinutes) AS totalTime,
              DATE_FORMAT(ADDTIME(r.resTime, SEC_TO_TIME(SUM(sr.durationMinutes) * 60)), '%l:%i') AS endTime
              FROM reservation r
              JOIN salon s ON r.salonID = s.salonID
              JOIN reservation_service sv ON r.resID = sv.resID
              JOIN service sr ON sv.serviceID = sr.serviceID
              WHERE r.resID = ?
              GROUP BY resID ORDER BY startTime ASC
            `;
            const [reservations] = await db.query(query, [resID]);
            console.log("SalonID: " + salonID);
            console.log("Reservations: " + reservations[0]);
            io.to(`salonCustomer_${salonID}`).emit("reservation:todays", {
              resID: reservations[0].resID,
              startTime: reservations[0].startTime,
              endTime: reservations[0].endTime,
            });
          }
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
  DATE_FORMAT(r.resTime, '%l:%i %p') AS resTime,
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
    const { employeeID } = req.body;
    const { employeeName } = req.body | null;
    const { customerID } = req.body;
    const { salonID } = req.body;

    const io = req.app.get("io");

    console.log(
      `CustomerID: ${customerID} \n SalonID: ${salonID}, \n EmployeeID: ${employeeID}, \n EmployeeName: ${employeeName}, \n resStatus: ${resStatus}`
    );

    const query = `UPDATE reservation SET resStatus = ?, employeeID = ? WHERE resID = ?`;
    const [result] = await db.query(query, [resStatus, employeeID, resID]);
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
        console.log(`checking salonID: ${salonID}`);
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

exports.getProcessingReservationsByEmployeeID = async (req, res) => {
  try {
    console.log(
      "Fetching processing reservations by employeeID" + req.params.employeeID
    );
    const { employeeID } = req.params;
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
WHERE r.employeeID = ? AND r.resStatus = 'processing'
GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, c.fullName, c.phone
ORDER BY r.resDate ASC, r.resTime ASC`;
    const values = [employeeID];
    const [results] = await db.query(query, values);
    if (results.length > 0) {
      res.status(200).json({
        success: true,
        data: results,
      });
    } else {
      res.status(404).json({
        success: false,
        message:
          "No processing reservations found for employeeID: " + employeeID,
      });
    }
  } catch (error) {
    return returnServerErrorMessage(res, error);
  }
};
exports.getCompletedReservationsByEmployeeID = async (req, res) => {
  console.log(
    "Fetching completed reservations by employeeID" + req.params.employeeID
  );
  try {
    const { employeeID } = req.params;
    const query = `
    SELECT
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
WHERE r.employeeID = ? AND r.resStatus = 'completed'
GROUP BY r.resID, r.resDate, r.resTime, r.resStatus, c.fullName, c.phone
ORDER BY r.resDate ASC, r.resTime ASC
    `;
    const values = [employeeID];
    const [results] = await db.query(query, values);
    if (results.length > 0) {
      res.status(200).json({
        success: true,
        data: results,
      });
    } else {
      res.status(404).json({
        success: false,
        message:
          "No completed reservations found for employeeID: " + employeeID,
      });
    }
  } catch (error) {
    return returnServerErrorMessage(res, error);
  }
};

exports.getTodaysReservationsBYsalonID = async (req, res) => {
  console.log("Fetching todays reservations by salonID" + req.params.salonID);
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // getMonth() is 0-based
    const day = String(today.getDate()).padStart(2, "0");

    const currentDate = `${year}-${month}-${day}`;
    const { salonID } = req.params;

    const values = [currentDate, salonID];

    const query = `
      SELECT 
      r.resID,
      s.salonID,
      r.resTime AS startTime,
      r.resDate,
      SUM(sr.durationMinutes) AS totalTime,
      DATE_FORMAT(ADDTIME(r.resTime, SEC_TO_TIME(SUM(sr.durationMinutes) * 60)), '%l:%i') AS endTime
      FROM reservation r
      JOIN salon s ON r.salonID = s.salonID
      JOIN reservation_service sv ON r.resID = sv.resID
      JOIN service sr ON sv.serviceID = sr.serviceID
      WHERE r.resDate = ? AND r.salonID= ?
      GROUP BY resID ORDER BY startTime ASC`;
    const [results] = await db.query(query, values);
    if (results.length > 0) {
      res.status(200).json({
        success: true,
        data: results,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No reservation found for today",
      });
    }
  } catch (error) {
    console.log(error);
    return returnServerErrorMessage(res, error);
  }
};

const getReservations = async (salonID, status, date) => {
  try {
    const query = `
      SELECT 
      r.resID,
      c.fullName AS customerName,
      c.phone AS customerPhone,
      e.fullName AS employeeName,
      r.resStatus,
      r.resDate,
      DATE_FORMAT(r.resTime, '%l:%i %p') AS resTime,
      GROUP_CONCAT(sv.serviceName) AS reservedServices,
      SUM(sv.servicePrice) AS totalPrice

      
      FROM reservation r
      JOIN customer c ON r.customerID = c.customerID
      JOIN reservation_service rs ON r.resID = rs.resID
      JOIN service sv ON rs.serviceID = sv.serviceID
      JOIN salon s ON r.salonID = s.salonID
      LEFT JOIN employee e ON r.employeeID = e.employeeID

      WHERE r.salonID = ? AND r.resStatus IN (?) AND r.resDate = ?

      GROUP BY r.resID
      ORDER BY r.resTime ASC;

    `;
    const values = [salonID, status, date];
    const [results] = await db.query(query, values);
    if (results.length > 0) {
      return {
        success: true,
        message: "Reservation found",
        data: results,
      };
    } else {
      return {
        success: false,
        message: "No reservation found for today",
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      message: error,
    };
  }
};

exports.getTodaysPendingReservationBySalonID = async (req, res) => {
  try {
    const { salonID } = req.params;

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const todayDate = `${year}-${month}-${day}`;
    console.log(todayDate);

    const pendingReservaion = await getReservations(
      salonID,
      ["pending"],
      todayDate
    );
    console.log(pendingReservaion);
    if (pendingReservaion.success) {
      res.status(200).json({
        success: true,
        message: pendingReservaion.message,
        data: pendingReservaion.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: pendingReservaion.message,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getTodaysProcessingReservationBySalonID = async (req, res) => {
  try {
    const { salonID } = req.params;

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const todayDate = `${year}-${month}-${day}`;

    const processingReservaion = await getReservations(
      salonID,
      ["processing"],
      todayDate
    );
    console.log(processingReservaion);
    if (processingReservaion.success) {
      res.status(200).json({
        success: true,
        message: processingReservaion.message,
        data: processingReservaion.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: processingReservaion.message,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};

exports.getTodaysCompletedReservationBySalonID = async (req, res) => {
  try {
    const { salonID } = req.params;

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const todayDate = `${year}-${month}-${day}`;

    const completedReservaion = await getReservations(
      salonID,
      ["completed"],
      todayDate
    );
    console.log(completedReservaion);
    if (completedReservaion.success) {
      res.status(200).json({
        success: true,
        message: completedReservaion.message,
        data: completedReservaion.data,
      });
    } else {
      res.status(404).json({
        success: false,
        message: completedReservaion.message,
      });
    }
  } catch (error) {
    console.log(error.message);
  }
};
