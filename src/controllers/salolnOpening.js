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

exports.updateSalonOpening = async (req, res) => {
  console.log(`Updating salon opening hours... ${req.params.salonID}`);
  try {
    const { salonID } = req.params;
    const { openHour } = req.body;
    console.log(openHour);
    const query = `UPDATE salon_opening_hours SET ? WHERE id=?`;
    const [results] = await db.query(query, [openHour, openHour.id]);
    if (results.affectedRows > 0) {
      res.status(200).json({
        success: true,
        message: "Saved successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "No data found",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
