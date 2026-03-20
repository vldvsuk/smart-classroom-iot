import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [latest, setLatest] = useState({ temperature: 0, humidity: 0 });

  useEffect(() => {
    const socket = io('http://localhost:3000');

    console.log('Trying to connect to WebSocket...');
  
    socket.on('connect', () => {
      console.log('Connected to WebSocket server!');
    });
  
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });
  
    socket.on('sensor-data', (data) => {
      console.log('New data:', data);
      
      const dataWithTime = {
        ...data,
        time: new Date().toLocaleTimeString()
      };
      
      setLatest({ temperature: data.temperature, humidity: data.humidity });
      setSensorData(prev => [...prev.slice(-19), dataWithTime]);
    });

    return () => {
      socket.off('sensor-data');
      socket.disconnect();
    };
  }, []);


  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>🏫 Smart Classroom IoT Monitor</h1>
      
      {/* Current values */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#ff6b6b', 
          borderRadius: '10px',
          color: 'white'
        }}>
          <h2>🌡️ Temperature</h2>
          <h1>{latest.temperature}°C</h1>
        </div>
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#4ecdc4', 
          borderRadius: '10px',
          color: 'white'
        }}>
          <h2>💧 Humidity</h2>
          <h1>{latest.humidity}%</h1>
        </div>
      </div>
      
      {/* Chart */}
      <h2>📊 Sensor History</h2>
      <LineChart width={800} height={400} data={sensorData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#ff6b6b" name="Temperature (°C)" />
        <Line yAxisId="right" type="monotone" dataKey="humidity" stroke="#4ecdc4" name="Humidity (%)" />
      </LineChart>
      
      {/* Raw data table */}
      <h2>📋 Recent Data</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Time</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Temperature (°C)</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Humidity (%)</th>
          </tr>
        </thead>
        <tbody>
          {sensorData.slice().reverse().map((data, idx) => (
            <tr key={idx}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{data.time}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{data.temperature}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{data.humidity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
