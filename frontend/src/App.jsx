import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const palette = {
  panel: '#111827',
  card: '#1f2937',
  accentTemp: '#f97316',
  accentHum: '#22d3ee',
  accentCo2: '#7c3aed',
  alert: '#ef4444',
  alertBg: 'rgba(239,68,68,0.15)',
  recoBg: 'rgba(234,179,8,0.12)',
  recoBorder: '#ca8a04',
  textPrimary: '#e5e7eb',
  textMuted: '#9ca3af',
  border: '#1f2937',
};

function StatCard({ title, value, unit, color, isAlert, alertMessage }) {
  const bg = isAlert
    ? `linear-gradient(135deg, ${palette.alert} 0%, #7f1d1d 80%)`
    : `linear-gradient(135deg, ${color} 0%, ${palette.card} 80%)`;

  return (
    <div style={{
      flex: 1, minWidth: 200, padding: '16px 18px',
      background: bg, borderRadius: '12px', color: palette.textPrimary,
      boxShadow: isAlert ? '0 0 20px rgba(239,68,68,0.4)' : '0 12px 30px rgba(0,0,0,0.25)',
      border: isAlert ? '1px solid #ef4444' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ fontSize: 14, color: isAlert ? '#fca5a5' : palette.textMuted }}>
        {title} {isAlert && '[!]'}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, marginTop: 6 }}>{value} {unit}</div>
      {isAlert && <div style={{ fontSize: 12, marginTop: 6, color: '#fca5a5' }}>{alertMessage}</div>}
    </div>
  );
}

function AlertBanner({ alerts }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <div style={{
      background: palette.alertBg, border: '1px solid #ef4444',
      borderRadius: 10, padding: '12px 16px', marginBottom: 12,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontWeight: 700, color: '#ef4444', fontSize: 14 }}>ALERT — Виявлено відхилення від норми:</div>
      {alerts.map((a, i) => (
        <div key={i} style={{ color: '#fca5a5', fontSize: 13 }}>- {a.message}</div>
      ))}
    </div>
  );
}

function RecommendationsBanner({ recommendations }) {
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div style={{
      background: palette.recoBg, border: `1px solid ${palette.recoBorder}`,
      borderRadius: 10, padding: '12px 16px', marginBottom: 22,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: 14 }}>Рекомендації:</div>
      {recommendations.map((r, i) => (
        <div key={i} style={{ color: '#fde68a', fontSize: 13 }}>- {r.message}</div>
      ))}
    </div>
  );
}

function App() {
  const [sensorData, setSensorData] = useState([]);
  const [latest, setLatest] = useState({ temperature: 0, humidity: 0, co2: 0, alerts: [], recommendations: [] });

  // Load history from DB on startup
  useEffect(() => {
    fetch('http://localhost:3000/history')
      .then(res => res.json())
      .then(rows => {
        const formatted = rows.map(row => ({
          temperature: row.temperature,
          humidity: row.humidity,
          co2: row.co2,
          alerts: row.has_alert ? [{ param: 'unknown', message: '' }] : [],
          recommendations: [],
          time: new Date(row.created_at).toLocaleTimeString(),
        }));
        setSensorData(formatted.slice(-20));
        if (formatted.length > 0) {
          const last = formatted[formatted.length - 1];
          setLatest(prev => ({ ...prev, ...last }));
        }
      })
      .catch(err => console.error('Failed to load history:', err));
  }, []);

  // Live WebSocket data
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect', () => console.log('Connected'));
    socket.on('disconnect', () => console.log('Disconnected'));
    socket.on('sensor-data', (data) => {
      const dataWithTime = { ...data, time: new Date().toLocaleTimeString() };
      setLatest(data);
      setSensorData(prev => [...prev.slice(-19), dataWithTime]);
    });
    return () => { socket.off('sensor-data'); socket.disconnect(); };
  }, []);

  const alerts = latest.alerts || [];
  const recommendations = latest.recommendations || [];
  const alertParams = new Set(alerts.map(a => a.param));
  const getAlertMessage = (param) => alerts.find(a => a.param === param)?.message || '';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.12), transparent 40%), radial-gradient(circle at 80% 0%, rgba(34,211,238,0.12), transparent 35%), #0b1220',
      color: palette.textPrimary,
      fontFamily: 'Montserrat, Inter, system-ui, sans-serif',
      padding: '36px 28px',
    }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>

        <header style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, color: palette.textMuted }}>Smart Classroom Dashboard</div>
            <h1 style={{ margin: 4, fontSize: 30, fontWeight: 700 }}>Environmental Metrics</h1>
          </div>
          <div style={{ fontSize: 13, color: palette.textMuted }}>Live via WebSocket</div>
        </header>

        <AlertBanner alerts={alerts} />
        <RecommendationsBanner recommendations={recommendations} />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '26px' }}>
          <StatCard title="Temperature" value={latest.temperature ?? 0} unit="C" color={palette.accentTemp} isAlert={alertParams.has('temperature')} alertMessage={getAlertMessage('temperature')} />
          <StatCard title="Humidity" value={latest.humidity ?? 0} unit="%" color={palette.accentHum} isAlert={alertParams.has('humidity')} alertMessage={getAlertMessage('humidity')} />
          <StatCard title="CO2" value={latest.co2 ?? 0} unit="ppm" color={palette.accentCo2} isAlert={alertParams.has('co2')} alertMessage={getAlertMessage('co2')} />
        </div>

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
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke={palette.accentTemp} name="Temperature (C)" dot={false} strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="humidity" stroke={palette.accentHum} name="Humidity (%)" dot={false} strokeWidth={2} />
                <Line yAxisId="co2" type="monotone" dataKey="co2" stroke={palette.accentCo2} name="CO2 (ppm)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: palette.panel, borderRadius: 14, padding: 18, boxShadow: '0 10px 30px rgba(0,0,0,0.22)', border: `1px solid ${palette.border}` }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: 18 }}>Recent Data</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ color: palette.textMuted, textAlign: 'left', borderBottom: `1px solid ${palette.border}` }}>
                <th style={{ padding: '10px 8px' }}>Time</th>
                <th style={{ padding: '10px 8px' }}>Temperature (C)</th>
                <th style={{ padding: '10px 8px' }}>Humidity (%)</th>
                <th style={{ padding: '10px 8px' }}>CO2 (ppm)</th>
                <th style={{ padding: '10px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {sensorData.slice().reverse().map((data, idx) => {
                const rowAlerts = data.alerts || [];
                const hasAlert = rowAlerts.length > 0;
                return (
                  <tr key={idx} style={{ borderBottom: `1px solid ${palette.border}`, background: hasAlert ? 'rgba(239,68,68,0.06)' : 'transparent' }}>
                    <td style={{ padding: '10px 8px' }}>{data.time}</td>
                    <td style={{ padding: '10px 8px', color: rowAlerts.some(a => a.param === 'temperature') ? '#ef4444' : palette.textPrimary }}>{data.temperature}</td>
                    <td style={{ padding: '10px 8px', color: rowAlerts.some(a => a.param === 'humidity') ? '#ef4444' : palette.textPrimary }}>{data.humidity}</td>
                    <td style={{ padding: '10px 8px', color: rowAlerts.some(a => a.param === 'co2') ? '#ef4444' : palette.textPrimary }}>{data.co2}</td>
                    <td style={{ padding: '10px 8px', color: hasAlert ? '#ef4444' : '#22c55e', fontSize: 12 }}>{hasAlert ? '[!] Відхилення' : 'Норма'}</td>
                  </tr>
                );
              })}
              {sensorData.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '12px 8px', color: palette.textMuted, textAlign: 'center' }}>Waiting for live data...</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;
