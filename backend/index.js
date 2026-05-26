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
  const recommendations = [];

  // Temperature
  if (data.temperature > THRESHOLDS.temperature.max) {
    alerts.push({ param: 'temperature', message: `Температура завищена (${data.temperature}°C > ${THRESHOLDS.temperature.max}°C)` });
    recommendations.push({ param: 'temperature', icon: '❄️', message: 'Увімкніть кондиціонер або провітріть приміщення' });
  } else if (data.temperature < THRESHOLDS.temperature.min) {
    alerts.push({ param: 'temperature', message: `Температура занижена (${data.temperature}°C < ${THRESHOLDS.temperature.min}°C)` });
    recommendations.push({ param: 'temperature', icon: '🔥', message: 'Увімкніть опалення або закрийте вікна' });
  }

  // Humidity
  if (data.humidity > THRESHOLDS.humidity.max) {
    alerts.push({ param: 'humidity', message: `Вологість завищена (${data.humidity}% > ${THRESHOLDS.humidity.max}%)` });
    recommendations.push({ param: 'humidity', icon: '💨', message: 'Увімкніть витяжку або осушувач повітря' });
  } else if (data.humidity < THRESHOLDS.humidity.min) {
    alerts.push({ param: 'humidity', message: `Вологість занижена (${data.humidity}% < ${THRESHOLDS.humidity.min}%)` });
    recommendations.push({ param: 'humidity', icon: '💧', message: 'Використайте зволожувач повітря' });
  }

  // CO2
  if (data.co2 > THRESHOLDS.co2.max) {
    alerts.push({ param: 'co2', message: `Рівень CO₂ перевищено (${data.co2} ppm > ${THRESHOLDS.co2.max} ppm)` });
    if (data.co2 > 1500) {
      recommendations.push({ param: 'co2', icon: '🚪', message: 'Терміново провітріть клас — рівень CO₂ критичний!' });
    } else {
      recommendations.push({ param: 'co2', icon: '🪟', message: 'Провітріть клас — відкрийте вікна на 10-15 хвилин' });
    }
  }

  return { alerts, recommendations };
}

app.get("/", (req, res) => {
  res.send("API running");
});

app.post("/data", (req, res) => {
  const sensorData = req.body;
  const { alerts, recommendations } = analyzeData(sensorData);
  const payload = { ...sensorData, alerts, recommendations };

  if (alerts.length > 0) {
    console.log("⚠️  ALERTS:", alerts.map(a => a.message).join(" | "));
    console.log("💡 RECOMMENDATIONS:", recommendations.map(r => r.message).join(" | "));
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
