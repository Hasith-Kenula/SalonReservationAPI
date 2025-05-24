const db = require("../bd");

exports.ADD = async (req, res) => {
  try {
    const { resID, serviceID } = req.body;
    const query =
      "INSERT INTO reservation_services(resID, serviceID) VALUES (?, ?)";
    const values = [resID, serviceID];
    const [result] = await db.query(query, values);
    if (result.affectedRows > 0) {
      res.status(201).json({
        success: true,
        message: "Service added successfully",
      });
    }
  } catch (error) {}
};
