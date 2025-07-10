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
    console.log("Token saved successfully");
  } catch (error) {
    console.log(`Error saving token: ${error}`);
    res.status(500).send({
      success: false,
      message: "Error saving token",
    });
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { token, title, body, data } = req.body;

    const message = {
      to: token,
      sound: "default",
      title: title,
      body: body,
      data: data,
      priority: "high",
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(message),
    });
    res.status(201).send({
      success: true,
      message: "Notification sent successfully",
    });
  } catch (error) {
    console.log(`Error sending notification: ${error}`);
    res.status(500).send({
      success: false,
      message: "Error sending notification",
    });
  }
};
