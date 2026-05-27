import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Thresholds ───────────────────────────────────────────────────────────────
const WARN = { temp: { lo: 19, hi: 26 }, hum: { lo: 42, hi: 58 }, co2: 850 };
const CRIT = { temp: { lo: 18, hi: 27 }, hum: { lo: 40, hi: 60 }, co2: 1000 };

function getLevel(param, value) {
  if (param === 'temperature') {
    if (value > CRIT.temp.hi || value < CRIT.temp.lo) return 'crit';
    if (value > WARN.temp.hi || value < WARN.temp.lo) return 'warn';
  }
  if (param === 'humidity') {
    if (value > CRIT.hum.hi || value < CRIT.hum.lo) return 'crit';
    if (value > WARN.hum.hi || value < WARN.hum.lo) return 'warn';
  }
  if (param === 'co2') {
    if (value > CRIT.co2) return 'crit';
    if (value > WARN.co2) return 'warn';
  }
  return 'ok';
}

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '#0d0f14',
  surface:  '#13161d',
  border:   '#1e2230',
  borderHi: '#2a2f42',
  text:     '#dde1ee',
  muted:    '#5a6080',
  ok:       '#4ade80',
  warn:     '#f59e0b',
  crit:     '#f43f5e',
  blue:     '#60a5fa',
  teal:     '#2dd4bf',
  purple:   '#a78bfa',
};

const levelColor = { ok: C.ok, warn: C.warn, crit: C.crit };

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const css = (obj) => Object.entries(obj).map(([k, v]) => `${k}:${v}`).join(';');

// ─── Connection dot ───────────────────────────────────────────────────────────
function ConnDot({ connected }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: C.muted, fontFamily: 'monospace' }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%',
        background: connected ? C.ok : C.crit,
        boxShadow: connected ? `0 0 8px ${C.ok}` : 'none',
        display: 'inline-block',
        transition: 'all .4s',
      }} />
      {connected ? 'live' : 'offline'}
    </span>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────
function MetricCard({ label, value, unit, param, sub }) {
  const level = getLevel(param, value);
  const color = levelColor[level];
  const prev = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (prev.current !== value) {
      setFlash(true);
      setTimeout(() => setFlash(false), 400);
      prev.current = value;
    }
  }, [value]);

  return (
    <div style={{
      flex: 1, minWidth: 180,
      background: C.surface,
      border: `1px solid ${flash ? color : C.border}`,
      borderRadius: 12,
      padding: '22px 24px',
      transition: 'border-color .3s',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* accent bar top */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color, opacity: 0.7, transition: 'background .4s' }} />

      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>{label}</div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 40, fontWeight: 700, color: C.text, fontFamily: 'monospace', lineHeight: 1, transition: 'color .3s' }}>
          {value}
        </span>
        <span style={{ fontSize: 14, color: C.muted }}>{unit}</span>
      </div>

      <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, display: 'inline-block', transition: 'background .4s' }} />
        <span style={{ fontSize: 11, color: color, transition: 'color .4s' }}>
          {level === 'ok' ? 'Normal' : level === 'warn' ? 'Warning' : 'Critical'}
        </span>
        {sub && <span style={{ fontSize: 11, color: C.muted, marginLeft: 4 }}>— {sub}</span>}
      </div>
    </div>
  );
}

// ─── Alert strip ──────────────────────────────────────────────────────────────
function AlertStrip({ alerts, recommendations }) {
  if (!alerts?.length) return null;
  return (
    <div style={{
      background: 'rgba(244,63,94,0.06)',
      border: `1px solid rgba(244,63,94,0.25)`,
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 10,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '6px 24px',
    }}>
      <div style={{ gridColumn: '1/-1', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.crit, marginBottom: 6 }}>
        Threshold exceeded
      </div>
      {alerts.map((a, i) => (
        <div key={i} style={{ fontSize: 13, color: '#fda4af' }}>— {a.message}</div>
      ))}
    </div>
  );
}

function RecoStrip({ recommendations }) {
  if (!recommendations?.length) return null;
  return (
    <div style={{
      background: 'rgba(245,158,11,0.05)',
      border: `1px solid rgba(245,158,11,0.2)`,
      borderRadius: 10,
      padding: '14px 18px',
      marginBottom: 24,
      display: 'flex',
      flexDirection: 'column',
      gap: 5,
    }}>
      <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.warn, marginBottom: 4 }}>
        Recommended actions
      </div>
      {recommendations.map((r, i) => (
        <div key={i} style={{ fontSize: 13, color: '#fcd34d' }}>— {r.message}</div>
      ))}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a1d28', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: C.muted, marginBottom: 6 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [history, setHistory]   = useState([]);
  const [latest, setLatest]     = useState({ temperature: '--', humidity: '--', co2: '--', alerts: [], recommendations: [] });
  const [connected, setConnected] = useState(false);

  // Load DB history
  useEffect(() => {
    fetch('http://localhost:3000/history')
      .then(r => r.json())
      .then(rows => {
        const fmt = rows.map(row => ({
          temperature: row.temperature,
          humidity: row.humidity,
          co2: row.co2,
          alerts: row.has_alert ? [{ param: 'unknown', message: '' }] : [],
          recommendations: [],
          time: new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setHistory(fmt.slice(-40));
        if (fmt.length > 0) setLatest(prev => ({ ...prev, ...fmt[fmt.length - 1] }));
      })
      .catch(() => {});
  }, []);

  // Live socket
  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('sensor-data', data => {
      const entry = { ...data, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
      setLatest(data);
      setHistory(prev => [...prev.slice(-39), entry]);
    });
    return () => socket.disconnect();
  }, []);

  const alerts = latest.alerts || [];
  const recos  = latest.recommendations || [];

  const getSub = (param) => {
    const a = alerts.find(a => a.param === param);
    return a ? a.message : null;
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", padding: '0' }}>

      {/* Top bar */}
      <div style={{ borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: C.text }}>Classroom Monitor</span>
          <span style={{ width: 1, height: 16, background: C.border, display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: C.muted }}>Environmental Control System</span>
        </div>
        <ConnDot connected={connected} />
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', padding: '32px 32px' }}>

        {/* Alerts */}
        <AlertStrip alerts={alerts} />
        <RecoStrip recommendations={recos} />

        {/* Metric cards */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
          <MetricCard label="Temperature" value={latest.temperature} unit="°C" param="temperature" sub={getSub('temperature')} />
          <MetricCard label="Relative Humidity" value={latest.humidity} unit="%" param="humidity" sub={getSub('humidity')} />
          <MetricCard label="CO₂ Concentration" value={latest.co2} unit="ppm" param="co2" sub={getSub('co2')} />
        </div>

        {/* Chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '24px 20px 16px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Sensor readings</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Last {history.length} data points</div>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: C.muted }}>
              <span style={{ color: C.blue }}>— temp</span>
              <span style={{ color: C.teal }}>— humidity</span>
              <span style={{ color: C.purple }}>— CO₂ /10</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={history} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.border} vertical={false} />
              <XAxis dataKey="time" stroke="transparent" tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} />
              <YAxis stroke="transparent" tick={{ fill: C.muted, fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="temperature" stroke={C.blue}   dot={false} strokeWidth={1.5} name="Temp (°C)" />
              <Line type="monotone" dataKey="humidity"    stroke={C.teal}   dot={false} strokeWidth={1.5} name="Humidity (%)" />
              <Line type="monotone" dataKey={(d) => d.co2 / 10} stroke={C.purple} dot={false} strokeWidth={1.5} name="CO₂ /10 (ppm)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Reading log</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.border}` }}>
                {['Time', 'Temp (°C)', 'Humidity (%)', 'CO₂ (ppm)', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 22px', textAlign: 'left', color: C.muted, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().slice(0, 15).map((row, i) => {
                const hasAlert = (row.alerts || []).length > 0;
                const tLvl = getLevel('temperature', row.temperature);
                const hLvl = getLevel('humidity', row.humidity);
                const cLvl = getLevel('co2', row.co2);
                return (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                    <td style={{ padding: '10px 22px', color: C.muted, fontFamily: 'monospace' }}>{row.time}</td>
                    <td style={{ padding: '10px 22px', color: levelColor[tLvl] }}>{row.temperature}</td>
                    <td style={{ padding: '10px 22px', color: levelColor[hLvl] }}>{row.humidity}</td>
                    <td style={{ padding: '10px 22px', color: levelColor[cLvl] }}>{row.co2}</td>
                    <td style={{ padding: '10px 22px' }}>
                      <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: hasAlert ? 'rgba(244,63,94,0.12)' : 'rgba(74,222,128,0.1)', color: hasAlert ? C.crit : C.ok, letterSpacing: '0.06em' }}>
                        {hasAlert ? 'ALERT' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {history.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '24px 22px', color: C.muted, textAlign: 'center' }}>Awaiting data...</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
