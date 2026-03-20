const express = require("express");
const app = express();

app.use(express.json()); 

app.get("/", (req, res) => {
    res.send("API running");
});

// accept data from simulator
app.post("/data", (req, res) => {
    const sensorData = req.body;
    console.log("Received from simulator:", sensorData);
    
    // here database and sending via WebSocke
    
    res.json({ status: "success", received: sensorData});
});
const PORT = 3000;

// for debuging 
const server = app.listen(PORT, () => {
    console.log("\n" + "=".repeat(50));
    console.log("Server started successfully!");
    console.log("=".repeat(50));
    console.log(`📡 API: http://localhost:${PORT}`);
});
console.log("Waiting for connections...");