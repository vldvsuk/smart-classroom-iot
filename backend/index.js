const express = require("express");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",  // Vite port
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json()); 

app.get("/", (req, res) => {
    res.send("API running");
});

// accept data from simulator
app.post("/data", (req, res) => {
    const sensorData = req.body;
    console.log("Received from simulator:", sensorData);

    io.emit('sensor-data', sensorData);
    
    // here database and sending via WebSocke
    
    res.json({ status: "success", received: sensorData});
});
const PORT = 3000;

// for debuging 
server.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log("Server started successfully!");
    console.log("=".repeat(50));
    console.log(`📡 API: http://localhost:${PORT}`);
});

console.log("Waiting for connections...");
