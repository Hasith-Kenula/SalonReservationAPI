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

exports.create = async (req, res) => {
  console.log(`-------------------Creating new employee...-------------------`);
  //const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const { salonID, fullName, phone, password } = req.body;
    const empID = await generateID();
    const query = `INSERT INTO employee (empID, salonID, fullName, phone, password) VALUES (?, ?, ?, ?, ?)`;
    const values = [empID, salonID, fullName, phone, password];
    const [rows] = await db.query(query, values);
    if (rows.affectedRows > 0) {
      res.status(201).json({
        success: true,
        message: "Employee created successfully",
        data: { rows },
      });
      console.log("Employee created successfully");
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
