const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const messageRoutes = require("./routes/messages");
const app = express();
const socket = require("socket.io");
const morgan = require("morgan")
require("dotenv").config();

app.use(morgan("dev"))
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB Connetion Successfull");
  })
  .catch((err) => {
    console.log(err.message);
  });

app.get("/ping", (_req, res) => {
  return res.json({ msg: "Ping Successful" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/test", (req, res) => {
  res.send("Testing route. API endpoint is working")
})

// Error handler
app.use((err, req, res, next) => {
  console.log("#".repeat(50))
  console.log("#".repeat(50))
  console.log("Error message: ", err?.message || err?.msg)
  console.log("Error name: ", err?.name)
  console.log("Error Stack:::::: ")
  console.error(err.stack); // Log the error stack trace
  console.log("#".repeat(50))
  console.log("#".repeat(50))
  res.status(500).send('Something broke!');
});

const server = app.listen(process.env.PORT, () =>
  console.log(`Server started on ${process.env.PORT}`)
);
const io = socket(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    // console.log("send: ", data.msg)
    const sendUserSocket = onlineUsers.get(data.to);
    // console.log("recepient: ", sendUserSocket)
    if (sendUserSocket) {
      console.log("received: ", data.msg)
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });
});
