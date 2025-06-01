const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;
let count = 0;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);
const pendingRequests = new Map();
io.on("connection", async (socket) => {
  const { salonID, customerID, employeeID } = socket.handshake.query;
  //console.log(`A client connected: ${socket.id} for salonID: ${salonID}`);
  console.warn(socket.handshake.query);
  if (salonID) {
    socket.join(`salon_${salonID}`);
    console.log(`Socket ${socket.id} joined salon room: ${salonID}`);
  }
  if (customerID) {
    socket.join(`customer_${customerID}`);
    console.log(`Socket ${socket.id} joined customer room: ${customerID}`);
  }
  if (employeeID) {
    socket.join(`employee_${employeeID}`);
    console.log(`Socket ${socket.id} joined employee room: ${employeeID}`);
  }
  socket.on("disconnect", () => {
    console.log(`A client disconnected: ${socket.id}`);
  });
  socket.on("joinRoom", (roomName) => {
    console.log(`Socket ${socket.id} joined room: ${roomName}`);
    socket.join(roomName);
  });
  socket.on("leaveRoom", (roomName) => {
    console.log(`Socket ${socket.id} left room: ${roomName}`);
    socket.leave(roomName);
  });
  // You can add more event listeners here
  socket.on(
    "reservation:sendRequestToCustomer",
    ({ resID, resStatus, customerID, employeeID, employeeName, salonID }) => {
      console.log(
        "reservation:sendSRequestToCustomer",
        resID,
        resStatus,
        customerID,
        employeeID,
        employeeName,
        salonID
      );

      io.to(`customer_${customerID}`).emit("reservation:confirmRequest", {
        resID: resID,
        customerID: customerID,
        employeeID: employeeID,
        salonID: salonID,
        employeeName: employeeName,
        resStatus: resStatus,
        message:
          resStatus == "processing"
            ? `Do you want to start your reservation?`
            : `Your reservation completed , please confirm`,
      });
      if (pendingRequests.has(resID)) {
        clearTimeout(pendingRequests.get(resID));
      }

      //set timeout to expire request after 30 seconds
      const timeoutID = setTimeout(() => {
        io.to(`customer_${customerID}`).emit("reservation:requestExpired", {
          resID,
        });
        pendingRequests.delete(resID);
      }, 30000); // 30 seconds
      pendingRequests.set(resID, timeoutID);
    }
  );
  socket.on(
    "reservation:confirmResponse",
    ({
      resID,
      customerID,
      employeeID,
      salonID,
      employeeName,
      confirmed,
      resStatus,
    }) => {
      if (!pendingRequests.has(resID)) {
        io.to(`customer_${customerID}`).emit("reservation:requestExpired", {
          resID,
        });
        return;
      }

      //clear timeout and delete pending request
      clearTimeout(pendingRequests.get(resID));
      pendingRequests.delete(resID);
      console.log("reservation:confirmResponse", resID, employeeID, confirmed);
      if (confirmed) {
        console.log("Reservation confirmed by customer");
        io.to(`employee_${employeeID}`).emit("reservation:confirmed", {
          resID,
          customerID,
          employeeID,
          employeeName,
          salonID,
          resStatus,
          confirmed: confirmed,
        });
      } else {
        console.log("Reservation cancelled by customer");
        io.to(`employee_${employeeID}`).emit("reservation:rejected", {
          resID,
          employeeID,
          confirmed: confirmed,
        });
        return;
      }
    }
  );
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
