const { json } = require("body-parser");
const db = require("../bd");
const { v4: uuidv4 } = require("uuid");

// for create unique id for salon
const generateID = async () => {
  let id;
  let exists = true;
  while (exists) {
    id = uuidv4().replace(/-/g, "").substring(0, 8);
    const [rows] = await db.query("SELECT * FROM employee WHERE empID = ?", [
      id,
    ]);
    exists = rows.length > 0;
  }
  return id;
};
const isEmployeeExisit = async (phone) => {
  try {
    const [rows] = await db.query("SELECT * FROM employee WHERE phone = ?", [
      phone,
    ]);
    return rows.length > 0;
  } catch (error) {
    console.log(error);
  }
};
const getEmployeeByID = async (id) => {
  try {
    const [rows] = await db.query("SELECT * FROM employee WHERE empID = ?", [
      id,
    ]);
    return rows[0];
  } catch (error) {
    console.log(error);
  }
};
exports.create = async (req, res) => {
  console.log(`-------------------Creating new employee...-------------------`);
  //const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const { salonID, fullName, phone, password } = req.body;

    if (await isEmployeeExisit(phone)) {
      console.log("Phone number already exists");
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }

    const empID = await generateID();

    const query = `INSERT INTO employee (empID, salonID, fullName, phone, password) VALUES (?, ?, ?, ?, ?)`;
    const values = [empID, salonID, fullName, phone, password];
    const [rows] = await db.query(query, values);

    if (rows.affectedRows > 0) {
      const newEmployee = await getEmployeeByID(empID);
      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: newEmployee,
      });
      console.log(`Employee created successfully \n $`);
    } else {
      res.status(400).json({
        success: false,
        message: "Employee creation failed",
      });
      console.log("Employee creation failed");
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.login = async (req, res) => {
  console.log(`-------------------Logging in employee...-------------------`);
  try {
    console.log(req.body);
    const { phone, password } = req.body;
    const query = "SELECT * FROM employee WHERE phone = ? AND password = ?";
    const values = [phone, password];
    const [rows] = await db.query(query, values);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "Login successfully",
        data: rows[0],
      });
      console.log("Login successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "Invalid phone or password",
      });
      console.log("Invalid phone or password");
    }
  } catch (error) {
    console.log("Internal Server Error" + error);
    req.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.update = async (req, res) => {
  console.log(`-------------------Updating employee...-------------------`);
  try {
    const { empID } = req.params;
    const { fullName, phone, password } = req.body;
    const query =
      "UPDATE employee SET fullName = ?, phone = ?, password = ? WHERE empID = ?";
    const values = [fullName, phone, password, empID];
    const [rows] = await db.query(query, values);
    if (rows.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Employee updated successfully",
      });
      console.log("Employee updated successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "Employee not found",
      });
      console.log("Employee updated successfully");
    }
  } catch (error) {
    console.log("Internal Server Error" + error);
    res.status(400).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAll = async (req, res) => {
  console.log(`-------------------Getting all employee...-------------------`);
  try {
    const query = "SELECT * FROM employee";
    const [rows] = await db.query(query);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "Employees retrieved successfully",
        data: rows,
      });
      console.log("Employees retrieved successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "No employees found",
      });
      console.log("No employees found");
    }
  } catch (error) {
    console.log("Internal Server Error" + error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.getAllBySalon = async (req, res) => {
  console.log(
    `-------------------Getting all employee by salon...-------------------`
  );
  try {
    const { salonID } = req.params;
    const query = "SELECT * FROM employee WHERE salonID = ?";
    const [rows] = await db.query(query, [salonID]);
    if (rows.length > 0) {
      res.status(200).json({
        success: true,
        message: "Employees retrieved successfully",
        data: rows,
      });
      console.log("Employees retrieved successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "No employees found",
      });
      console.log("No employees found");
    }
  } catch (error) {
    console.log("Internal Server Error" + error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

exports.delete = async (req, res) => {
  console.log(`-------------------Deleting employee...-------------------`);
  try {
    const { empID } = req.params;
    const query = "DELETE FROM employee WHERE empID = ?";
    const [rows] = await db.query(query, [empID]);
    if (rows.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Employee deleted successfully",
      });
      console.log("Employee deleted successfully");
    } else {
      res.status(400).json({
        success: false,
        message: "Employee not found",
      });
      console.log("Employee not found");
    }
  } catch (error) {
    console.log("Internal Server Error" + error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
