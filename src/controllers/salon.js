const db = require("../bd");
const { getSpecific } = require("./reservation");
const { v4: uuidv4 } = require("uuid");

// for create unique id for salon
const generateID = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = uuidv4().replace(/-/g, "").substring(0, 8);
    const [rows] = await db.query("SELECT * FROM salon WHERE salonID = ?", [
      id,
    ]);
    exists = rows.length > 0;
  }
  return id;
};
//get all salon details from database
exports.getAll = async (req, res) => {
  try {
    const query = "SELECT * FROM salon";
    const [rows] = await db.query(query);
    res.status(200).json({
      success: true,
      message: "Salon details fetched successfully",
      data: rows,
    });
  } catch (error) {
    console.log(error);
  }
};
//get specifi salon details by id from database
exports.getSpecific = (req, res) => {
  try {
    const salonID = req.params.salonID;
    const query = "SELECT * FROM salon WHERE id = ?";

    const [row] = db.query(query, [salonID]);
    if (row.length == 0) {
      res.status(404).json({ message: "Salon not found" });
    } else {
      res.status(200).json({
        message: "successfull",
        Data: row[0],
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error fetching data" });
  }
};
//register new salon in database
exports.register = async (req, res) => {
  console.log("Registering a new salon");
  try {
    const { salonName, ownerName, phone, password, address } = req.body;
    console.log(
      `Data: ${salonName}, ${ownerName}, ${phone}, ${password}, ${address}`
    );

    const [rows] = await db.query("SELECT * FROM salon WHERE phone = ?", [
      phone,
    ]);
    if (rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Salon already exists" });
    }

    const salonID = await generateID();
    console.log(`SalonID: ${salonID}`);
    const query =
      "INSERT INTO salon (salonID, SalonName, ownerName, phone, password, address) VALUES(?, ?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [
      salonID,
      salonName,
      ownerName,
      phone,
      password,
      address,
    ]);
    if (result.affectedRows > 0) {
      res.json({
        success: true,
        message: "Salon registered successfully",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Something went wrong with registration",
    });
  }
};
//check login validtion
exports.login = async (req, res) => {
  console.log("Logging in a salon");
  try {
    const { phone, password } = req.body;
    console.log(req.body);
    const query = "SELECT * FROM salon WHERE phone = ? AND password = ?";
    const [rows] = await db.query(query, [phone, password]);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successfully",
        Data: rows[0],
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid phone or password!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong with login: " + error.message,
    });
  }
};
exports.update = async (req, res) => {
  console.log("--------------Updating salon--------------: ");
  try {
    const { salonID } = req.params;
    const { salonName, ownerName, phone, address } = req.body;
    console.log(req.params + req.body);

    const query =
      "UPDATE salon SET salonName = ?, ownerName = ?, phone = ?, address = ? WHERE salonID = ?";
    const [result] = await db.query(query, [
      salonName,
      ownerName,
      phone,
      address,
      salonID,
    ]);
    if (result.affectedRows > 0) {
      console.log(`Salon updated successfully - ${salonID}`);
      res.status(200).json({
        success: true,
        message: "Salon updated successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Salon profile not updated",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Database error" + error.message });
  }
};
