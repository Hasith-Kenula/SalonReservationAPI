exports.getCustomerConfirmation = async (req, res) => {
  console.log(
    "------------------sending request confirmation------------------"
  );
  try {
    const { resID } = req.body;
    const { resStatus } = req.body;
    const { employeeID } = req.body;
    const { employeeName } = req.body;
    const { customerID } = req.body;
    const { salonID } = req.body;

    const io = req.app.get("io");

    io.to(`customer_${customerID}`).emit("reservation:confirmRequest", {
      resID: resID,
      customerID: customerID,
      employeeID: employeeID,
      salonID: salonID,
      employeeName: employeeName,
      resStatus: resStatus,
      message: `Do you want to confirm your reservation with ${employeeName}?`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Error occurred while sending confirmation request",
    });
  } finally {
    res.status(200).json({
      success: true,
      message: "Customer confirmation request sent successfully",
    });
  }
};
