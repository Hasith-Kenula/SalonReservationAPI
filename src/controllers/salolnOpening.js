const db = require("../bd");

exports.getSalonOpening = async (req, res) => {
  try {
    const { salonID } = req.params;
    const query = `SELECT * FROM salon_opening_hours WHERE salonID=?`;
    const [results] = await db.query(query, [salonID]);
    if (results.length > 0) {
      res.status(200).json({
        success: true,
        data: results,
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No data found",
      });
    }
  } catch (error) {}
};
