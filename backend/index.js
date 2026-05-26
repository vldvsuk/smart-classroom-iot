const express = require("express");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Thresholds
const THRESHOLDS = {
  temperature: { min: 18, max: 27 },
  humidity:    { min: 40, max: 60 },
  co2:         { max: 1000 },
};

function analyzeData(data) {
  const alerts = [];

  if (data.temperature > THRESHOLDS.temperature.max) {
    alerts.push({ param: 'temperature', message: `Температура завищена (${data.temperature}°C > ${THRESHOLDS.temperature.max}°C)` });
  } else if (data.temperature < THRESHOLDS.temperature.min) {
    alerts.push({ param: 'temperature', message: `Температура занижена (${data.temperature}°C < ${THRESHOLDS.temperature.min}°C)` });
  }

  if (data.humidity > THRESHOLDS.humidity.max) {
    alerts.push({ param: 'humidity', message: `Вологість завищена (${data.humidity}% > ${THRESHOLDS.humidity.max}%)` });
  } else if (data.humidity < THRESHOLDS.humidity.min) {
    alerts.push({ param: 'humidity', message: `Вологість занижена (${data.humidity}% < ${THRESHOLDS.humidity.min}%)` });
  }

  if (data.co2 > THRESHOLDS.co2.max) {
    alerts.push({ param: 'co2', message: `Рівень CO₂ перевищено (${data.co2} ppm > ${THRESHOLDS.co2.max} ppm)` });
  }

  return alerts;
}

app.get("/", (req, res) => {
  res.send("API running");
});

app.post("/data", (req, res) => {
  const sensorData = req.body;
  const alerts = analyzeData(sensorData);
  const payload = { ...sensorData, alerts };

  if (alerts.length > 0) {
    console.log("⚠️  ALERTS:", alerts.map(a => a.message).join(" | "));
  }
  console.log("Received:", sensorData);

  io.emit('sensor-data', payload);
  res.json({ status: "success", received: payload });
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("Server started successfully!");
  console.log("=".repeat(50));
  console.log(`📡 API: http://localhost:${PORT}`);
});

console.log("Waiting for connections...");
