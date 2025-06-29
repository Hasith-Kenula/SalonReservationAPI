const db = require("../bd");

exports.saveToken = async (req, res) => {
  console.log("Notification Endpoint");
  const { token, userID, role } = req.body;
  console.log(req.body);
  try {
    await db.query(
      "REPLACE INTO notification_token (userID, role, token) VALUES (?, ?, ?)",
      [userID, role, token]
    );
    res.status(201).send({
      success: true,
      message: "Token saved successfully",
    });
  } catch (error) {
    console.log(`Error saving token: ${error}`);
    res.status(500).send({
      success: false,
      message: "Error saving token",
    });
  }
};
