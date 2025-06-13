const db = require("../bd");

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, email } = req.body;
    const queryCustomer = `SELECT * FROM customer WHERE email = ?`;
    const queryemployee = `SELECT * FROM employee WHERE email = ?`;
    const querySalon = `SELECT * FROM salon WHERE email = ?`;

    const [rows] = await db.query(queryCustomer, [email]);
    const [rowsEmployee] = await db.query(queryemployee, [email]);
    const [rowsSalon] = await db.query(querySalon, [email]);
    if (rows.length > 0) {
      const [result] = await db.query(
        `UPDATE customer SET password = ? WHERE email = ?`,
        [newPassword, email]
      );
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: "Failed to change password",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } else if (rowsEmployee.length > 0) {
      const [result] = await db.query(
        `UPDATE employee SET password = ? WHERE email = ?`,
        [newPassword, email]
      );
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: "Failed to change password",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } else if (rowsSalon.length > 0) {
      const [result] = await db.query(
        `UPDATE salon SET password = ? WHERE email = ?`,
        [newPassword, email]
      );
      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: "Failed to change password",
        });
      }
      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    }
  } catch (error) {}
};
