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
  try {
    const customerID = await generateID();
    const { name, phone, password, address } = req.body;

    const isExists = await db.query("SELECT * FROM customer WHERE phone = ?", [
      phone,
    ]);
    if (isExists.length > 0) {
      return res.status(409).json({
        message: "Phone number already registered!",
      });
    }
    const query = "INSERT INTO customer VALUES(?, ?, ?, ?, ?)";
    const result = await db.query(query, [
      customerID,
      name,
      phone,
      password,
      address,
    ]);
    res.status(200).send({
      message: "Customer created successfully",
      customerID: customerID,
      result: result,
    });
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
        message: "successful",
        Data: result[0], //return the customer data
      });
    } else {
      res.status(401).json({
        message: "Invalid phone number or password",
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Somthing wrong with login!",
    });
  }
};
