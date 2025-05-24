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
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.messsage });
  }
};

exports.getSpecific = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`SELECT * FROM reservation WHERE resID =?`, [
      id,
    ]);

    res.status(200).json({
      Message: "successfull",
      Data: rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
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
    res.status(500).json({ error: err.message });
  }
};
