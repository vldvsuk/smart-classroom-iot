import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [latest, setLatest] = useState({ temperature: 0, humidity: 0, co2: 0 });

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
      
      setLatest({ temperature: data.temperature, humidity: data.humidity, co2: data.co2 });
      setSensorData(prev => [...prev.slice(-19), dataWithTime]);
    });

    return () => {
      socket.off('sensor-data');
      socket.disconnect();
    };
  }, []);


  const palette = {
    surface: '#0f172a',
    panel: '#111827',
    card: '#1f2937',
    accentTemp: '#f97316',
    accentHum: '#22d3ee',
    accentCo2: '#7c3aed',
    textPrimary: '#e5e7eb',
    textMuted: '#9ca3af',
    border: '#1f2937'
  };

  const statCard = (title, value, unit, color) => (
    <div style={{ 
      flex: 1,
      minWidth: 200,
      padding: '16px 18px',
      background: `linear-gradient(135deg, ${color} 0%, ${palette.card} 80%)`,
      borderRadius: '12px',
      color: palette.textPrimary,
      boxShadow: '0 12px 30px rgba(0,0,0,0.25)'
    }}>
      <div style={{ fontSize: 14, letterSpacing: 0.5, color: palette.textMuted }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{value} {unit}</div>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.12), transparent 35%), #0b1220',
      color: palette.textPrimary,
      fontFamily: 'Montserrat, Inter, system-ui, -apple-system, sans-serif',
      padding: '36px 28px'
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: palette.textMuted, letterSpacing: 0.4 }}>Smart Classroom Dashboard</div>
            <h1 style={{ margin: 4, fontSize: 30, fontWeight: 700, color: palette.textPrimary }}>Environmental Metrics</h1>
          </div>
          <div style={{ fontSize: 13, color: palette.textMuted }}>Live via WebSocket</div>
        </header>

        {/* Current values */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '26px' }}>
          {statCard('Temperature', latest.temperature ?? 0, '°C', palette.accentTemp)}
          {statCard('Humidity', latest.humidity ?? 0, '%', palette.accentHum)}
          {statCard('CO₂', latest.co2 ?? 0, 'ppm', palette.accentCo2)}
        </div>

        {/* Chart */}
        <div style={{ background: palette.panel, borderRadius: 14, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.25)', border: `1px solid ${palette.border}`, marginBottom: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Sensor History</h2>
            <span style={{ fontSize: 12, color: palette.textMuted }}>Last {sensorData.length} points</span>
          </div>
          <div style={{ width: '100%', height: 360 }}>
            <ResponsiveContainer>
              <LineChart data={sensorData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="time" stroke={palette.textMuted} tick={{ fill: palette.textMuted }} />
                <YAxis yAxisId="left" stroke={palette.textMuted} tick={{ fill: palette.textMuted }} />
                <YAxis yAxisId="right" orientation="right" stroke={palette.textMuted} tick={{ fill: palette.textMuted }} />
                <YAxis yAxisId="co2" orientation="right" width={70} stroke={palette.textMuted} tick={{ fill: palette.textMuted }} />
                <Tooltip contentStyle={{ background: palette.card, border: `1px solid ${palette.border}`, borderRadius: 8, color: palette.textPrimary }} />
                <Legend wrapperStyle={{ color: palette.textMuted }} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke={palette.accentTemp} name="Temperature (°C)" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" stroke={palette.accentHum} name="Humidity (%)" dot={false} strokeWidth={2} />
                <Line yAxisId="co2" type="monotone" dataKey="co2" stroke={palette.accentCo2} name="CO₂ (ppm)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Raw data table */}
        <div style={{ background: palette.panel, borderRadius: 14, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.22)', border: `1px solid ${palette.border}` }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Recent Data</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: palette.textMuted, textAlign: 'left', borderBottom: `1px solid ${palette.border}` }}>
                <th style={{ padding: '10px 8px' }}>Time</th>
                <th style={{ padding: '10px 8px' }}>Temperature (°C)</th>
                <th style={{ padding: '10px 8px' }}>Humidity (%)</th>
                <th style={{ padding: '10px 8px' }}>CO₂ (ppm)</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.slice().reverse().map((data, idx) => (
                <tr key={idx} style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <td style={{ padding: '10px 8px', color: palette.textPrimary }}>{data.time}</td>
                  <td style={{ padding: '10px 8px', color: palette.textPrimary }}>{data.temperature}</td>
                  <td style={{ padding: '10px 8px', color: palette.textPrimary }}>{data.humidity}</td>
                  <td style={{ padding: '10px 8px', color: palette.textPrimary }}>{data.co2}</td>
                </tr>
              ))}
              {sensorData.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '12px 8px', color: palette.textMuted, textAlign: 'center' }}>
                    Waiting for live data...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
