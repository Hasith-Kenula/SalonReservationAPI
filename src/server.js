const http = require("http");
const app = require("./app");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("io", io);
io.on("connection", async (socket) => {
  const { salonID, customerID } = socket.handshake.query;
  //console.log(`A client connected: ${socket.id} for salonID: ${salonID}`);
  if (salonID) {
    socket.join(`salon_${salonID}`);
    console.log(`Socket ${socket.id} joined salon room: ${salonID}`);
  }
  if (customerID) {
    socket.join(`customer_${customerID}`);
    console.log(`Socket ${socket.id} joined customer room: ${customerID}`);
  }

  socket.on("disconnect", () => {
    console.log(`A client disconnected: ${socket.id}`);
  });
  // You can add more event listeners here
});

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
