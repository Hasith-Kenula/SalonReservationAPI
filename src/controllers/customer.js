const db = require("../bd");
const { v4: uuidv4 } = require("uuid");

// for create unique id for salon
const generateID = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = uuidv4().replace(/-/g, "").substring(0, 8);
    const [rows] = await db.query(
      "SELECT * FROM customer WHERE customerID = ?",
      [id]
    );
    exists = rows.length > 0;
  }
  return id;
};
//get all customers
exports.getAll = async (req, res) => {
  try {
    const query = "SELECT * FROM customer";
    const [result] = await db.query(query);
    res.status(200).json({
      Message: "successfull",
      Data: result,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error fetching customers",
    });
  }
};
//get sepecific customer
exports.getSpecific = async (req, res) => {
  try {
    const customerID = req.params.customerID;
    const query = "SELECT * FROM customer WHERE customerID = ?";
    const [result] = await db.query(query, [customerID]);
    res.status(200).json(result[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error fetching customer",
    });
  }
};
//register a new customer
exports.register = async (req, res) => {
  console.log("Registering new customer");
  try {
    const customerID = await generateID();
    const { fullName, phone, password, address } = req.body;

    console.log(`Data: ${phone}`);

    const [isExists] = await db.query(
      "SELECT * FROM customer WHERE phone = ?",
      [phone]
    );
    if (isExists.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Phone number already registered!",
      });
    }
    const query =
      "INSERT INTO customer(customerID, fullName, phone, password, address) VALUES(?, ?, ?, ?, ?)";
    const [result] = await db.query(query, [
      customerID,
      fullName,
      phone,
      password,
      address,
    ]);
    if (result.affectedRows > 0) {
      res.status(200).send({
        success: true,
        message: "Registered successfully",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: "Error creating customer" });
  }
};
//login
exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    console.log(req.body);
    const query = "SELECT * FROM customer WHERE phone = ? AND password = ?";
    const [result] = await db.query(query, [phone, password]);
    if (result.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successfully",
        data: result[0],
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid phone number or password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Somthing wrong with login!",
    });
  }
};

exports.update = async (req, res) => {
  console.log(
    `------------Updating customer(id = ${req.params.customerID})------------`
  );
  try {
    const { customerID } = req.params;
    const { fullName, phone, address } = req.body;
    console.log("Data: " + req.params.customerID);
    console.log("Data: " + req.body.fullName);
    console.log("Data: " + req.body.phone);
    console.log("Data: " + req.body.address);
    const query =
      "UPDATE customer SET fullName = ?, phone = ?, address = ? WHERE customerID = ?";
    const [result] = await db.query(query, [
      fullName,
      phone,
      address,
      customerID,
    ]);
    console.log("Result: " + result.affectedRows);
    if (result.affectedRows > 0) {
      console.log("customer updated");
      res.status(200).json({
        success: true,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Profile not updated",
      });
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Database error" + error.message });
  }
};
