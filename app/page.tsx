"use client";

import { useEffect, useState, useLayoutEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseconfig";
import { 
  Thermometer, 
  Droplets, 
  Gauge,
  Clock,
  ChevronDown,
  Activity,
  ShieldAlert,
  Radio
} from "lucide-react";

// --- GLOBAL STYLES: SF PRO DISPLAY FONT ---
const globalStyles = `
@import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;400;500;600;700&display=swap');

* {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  letter-spacing: -0.3px;
}

body {
  background: #000;
}
`;

// --- PREMIUM WEATHER ICON COMPONENT ---
const PremiumWeatherIcon = ({ type, className = "w-12 h-12" }: { type: string; className?: string }) => {
  const t = type.toLowerCase();
  
  if (t.includes("heavy") || t.includes("storm") || t.includes("thunder")) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M46.5 40.5H21.5C14.6 40.5 9 34.9 9 28C9 21.5 13.9 16.1 20.2 15.6C22.3 8.5 29.5 3.6 37.3 4.7C43.5 5.6 48.5 10.6 49.6 16.8C55.4 17.8 60 22.9 60 29C60 35.3 54.9 40.5 48.5 40.5H46.5Z" fill="#94A3B8" />
        <path d="M35 38L24 51H32L30 62L43 47H34L35 38Z" fill="#FBBF24" />
      </svg>
    );
  }
  if (t.includes("rain") || t.includes("drizzle") || t.includes("showers")) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M46.5 38.5H21.5C14.6 38.5 9 32.9 9 26C9 19.5 13.9 14.1 20.2 13.6C22.3 6.5 29.5 1.6 37.3 2.7C43.5 3.6 48.5 8.6 49.6 14.8C55.4 15.8 60 20.9 60 27C60 33.3 54.9 38.5 48.5 38.5H46.5Z" fill="#E2E8F0" />
        <path d="M22 45L18 55 M32 45L28 55 M42 45L38 55 M27 49L23 59 M37 49L33 59" stroke="#60A5FA" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (t.includes("cloud") || t.includes("overcast")) {
    return (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <circle cx="26" cy="22" r="16" fill="#FFC300" />
        <path d="M48.5 46.5H23.5C16.6 46.5 11 40.9 11 34C11 27.5 15.9 22.1 22.2 21.6C24.3 14.5 31.5 9.6 39.3 10.7C45.5 11.6 50.5 16.6 51.6 22.8C57.4 23.8 62 28.9 62 35C62 41.3 56.9 46.5 50.5 46.5H48.5Z" fill="#FFFFFF" fillOpacity="0.85" />
      </svg>
    );
  }
  
  return (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="32" cy="32" r="22" fill="#FFC300" />
    </svg>
  );
};

// --- APPARENT TEMPERATURE CALCULATOR ---
function getFeelsLike(t: number, h: number): number {
  if (!t) return 0;
  const e = (h / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
  return parseFloat((t + 0.33 * e - 4.0).toFixed(1));
}

// --- DANGER LEVEL COLOR MAPPING ---
function getDangerLevelConfig(status?: string | null) {
  const s = (status || "").toLowerCase();

  if (s.includes("red") || s.includes("severe") || s.includes("emergency") || s.includes("critical")) {
    return { key: "red", color: "#EF4444", soft: "rgba(239,68,68,0.18)", glow: "rgba(239,68,68,0.55)", label: status || "Red" };
  }
  if (s.includes("orange") || s.includes("warning")) {
    return { key: "orange", color: "#F97316", soft: "rgba(249,115,22,0.18)", glow: "rgba(249,115,22,0.55)", label: status || "Orange" };
  }
  if (s.includes("yellow") || s.includes("advisory") || s.includes("watch")) {
    return { key: "yellow", color: "#EAB308", soft: "rgba(234,179,8,0.18)", glow: "rgba(234,179,8,0.55)", label: status || "Yellow" };
  }
  if (s.includes("green") || s.includes("safe") || s.includes("normal") || s.includes("clear")) {
    return { key: "green", color: "#22C55E", soft: "rgba(34,197,94,0.18)", glow: "rgba(34,197,94,0.55)", label: status || "Safe" };
  }
  return { key: "unknown", color: "#94A3B8", soft: "rgba(148,163,184,0.18)", glow: "rgba(148,163,184,0.4)", label: status || "Awaiting Data" };
}

// --- CORE AGGREGATION ENGINE (30s intervals -> Hourly/Daily) ---
function processSensorHistory(rawHistoryObj: Record<string, any>) {
  if (!rawHistoryObj) return { hourly: [], daily: [] };

  // Convert Firebase object map to array
  const items = Object.values(rawHistoryObj);
  
  // Parse and filter valid dates
  const validItems = items.map(item => {
    // Check various common timestamp keys
    const tsString = item.timestamp || item.time || item.createdAt; 
    let dt = new Date(tsString);
    
    if (isNaN(dt.getTime()) && typeof tsString === 'string') {
      dt = new Date(tsString.replace(/['"]/g, '').trim());
    }

    return { ...item, date: dt, isValid: !isNaN(dt.getTime()) };
  }).filter(item => item.isValid).sort((a, b) => a.date.getTime() - b.date.getTime());

  if (validItems.length === 0) return { hourly: [], daily: [] };

  const hourlyGroups: Record<string, any> = {};
  const dailyGroups: Record<string, any> = {};

  validItems.forEach(item => {
    const d = item.date;
    // Grouping keys using local time
    const hourKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

    // Extract values with fallbacks in case DB keys vary slightly
    const temp = item.avg_temp ?? item.temperature ?? item.temp ?? 0;
    const hum = item.avg_humidity ?? item.humidity ?? item.hum ?? 0;
    const press = item.avg_pressure ?? item.pressure ?? item.press ?? 0;
    const soil = item.median_soil ?? item.soil_moisture ?? item.soil ?? 0;

    // Aggregate Hourly
    if (!hourlyGroups[hourKey]) hourlyGroups[hourKey] = { count: 0, temp: 0, hum: 0, press: 0, soil: 0, date: d };
    hourlyGroups[hourKey].count++;
    hourlyGroups[hourKey].temp += temp;
    hourlyGroups[hourKey].hum += hum;
    hourlyGroups[hourKey].press += press;
    hourlyGroups[hourKey].soil += soil;

    // Aggregate Daily
    if (!dailyGroups[dayKey]) dailyGroups[dayKey] = { count: 0, temp: 0, hum: 0, press: 0, soil: 0, date: d };
    dailyGroups[dayKey].count++;
    dailyGroups[dayKey].temp += temp;
    dailyGroups[dayKey].hum += hum;
    dailyGroups[dayKey].press += press;
    dailyGroups[dayKey].soil += soil;
  });

  // Calculate Averages and format labels
  const hourly = Object.values(hourlyGroups).map(g => ({
    avg_temp: g.temp / g.count,
    avg_humidity: g.hum / g.count,
    avg_pressure: g.press / g.count,
    median_soil: g.soil / g.count,
    date: g.date,
    label: g.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  const daily = Object.values(dailyGroups).map(g => ({
    avg_temp: g.temp / g.count,
    avg_humidity: g.hum / g.count,
    avg_pressure: g.press / g.count,
    median_soil: g.soil / g.count,
    date: g.date,
    label: g.date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
  })).sort((a, b) => a.date.getTime() - b.date.getTime());

  return { hourly, daily };
}

// --- SEEDED PSEUDO-RANDOM GENERATOR (Deterministic, Hydration-Safe) ---
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// --- WEATHER BACKGROUND ANIMATION ---
function WeatherAnimation({ isRainy, isCloudy, isNight }: { isRainy: boolean; isCloudy: boolean; isNight: boolean }) {
  const [starPositions, setStarPositions] = useState<Array<{ top: number; left: number; duration: number; delay: number }>>([]);
  const [rainPositions, setRainPositions] = useState<Array<{ left: number; duration: number; delay: number }>>([]);

  useLayoutEffect(() => {
    setStarPositions(
      [...Array(40)].map((_, i) => ({
        top: seededRandom(i * 1.5) * 50,
        left: seededRandom(i * 2.3) * 100,
        duration: 2 + seededRandom(i * 3.7) * 4,
        delay: seededRandom(i * 4.1) * 2,
      }))
    );

    setRainPositions(
      [...Array(50)].map((_, i) => ({
        left: seededRandom(i * 1.7) * 100,
        duration: 0.6 + seededRandom(i * 2.5) * 0.3,
        delay: seededRandom(i * 3.3) * 2,
      }))
    );
  }, []);

  const skyGradient = isNight
    ? isRainy 
      ? "from-[#0d1117] via-[#161b22] to-[#21262d]"
      : isCloudy
      ? "from-[#111827] via-[#1f2937] to-[#374151]"
      : "from-[#020617] via-[#0f172a] to-[#1e293b]"
    : isRainy
    ? "from-[#475569] via-[#64748b] to-[#94a3b8]"
    : isCloudy
    ? "from-[#60a5fa] via-[#93c5fd] to-[#bfdbfe]"
    : "from-[#2563eb] via-[#3b82f6] to-[#60a5fa]";

  return (
    <div className="fixed inset-0 overflow-hidden z-0 pointer-events-none select-none">
      <div className={`absolute inset-0 transition-all duration-1000 bg-gradient-to-b ${skyGradient}`} />

      {isNight && !isRainy && !isCloudy && starPositions.length > 0 && (
        <div className="absolute inset-0 opacity-80">
          {starPositions.map((star, i) => (
            <motion.div
              key={`star-${i}`}
              className="absolute w-1 h-1 bg-white rounded-full shadow-[0_0_4px_#fff]"
              style={{ top: `${star.top}%`, left: `${star.left}%` }}
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ repeat: Infinity, duration: star.duration, delay: star.delay, ease: "easeInOut" }}
            />
          ))}
        </div>
      )}

      <div className="absolute top-10 inset-x-0 h-64 opacity-50 mix-blend-overlay">
        <motion.div 
          className={`absolute left-[-20%] w-[35rem] h-32 rounded-full blur-3xl ${isNight ? 'bg-slate-800/80' : 'bg-white/80'}`}
          animate={{ x: ["0vw", "120vw"] }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        />
        <motion.div 
          className={`absolute left-[-40%] top-20 w-[45rem] h-40 rounded-full blur-3xl ${isNight ? 'bg-slate-900/90' : 'bg-white/90'}`}
          animate={{ x: ["0vw", "140vw"] }}
          transition={{ repeat: Infinity, duration: 80, ease: "linear", delay: 10 }}
        />
        
        {isCloudy && (
          <motion.div 
            className={`absolute left-[-50%] top-5 w-[55rem] h-48 rounded-full blur-3xl ${isNight ? 'bg-slate-700/80' : 'bg-white/70'}`}
            animate={{ x: ["0vw", "150vw"] }}
            transition={{ repeat: Infinity, duration: 90, ease: "linear", delay: 5 }}
          />
        )}
      </div>

      {isRainy && rainPositions.length > 0 && (
        <div className="absolute inset-0 opacity-40 z-20">
          {rainPositions.map((rain, i) => (
            <motion.div
              key={`rain-${i}`}
              className={`absolute w-[1.5px] h-20 rounded-full ${isNight ? 'bg-slate-400/60' : 'bg-blue-100/80'}`}
              style={{ left: `${rain.left}%`, top: `-100px` }}
              animate={{ y: ["0vh", "120vh"], x: ["0px", "-20px"] }}
              transition={{ repeat: Infinity, duration: rain.duration, delay: rain.delay, ease: "linear" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- MINI SPARKLINE CHART ---
function MiniSparkline({ data, dataKey, color }: { data: Array<any>; dataKey: string; color: string }) {
  if (!data || data.length < 2) return <div className="h-10 w-full mt-4 bg-white/5 rounded-2xl" />;
  
  const values = data.map(d => d[dataKey] || 0);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  
  // Add 10% padding top and bottom so lines don't hit the absolute edge
  const padding = (rawMax - rawMin) * 0.1 || 1; 
  const max = rawMax + padding;
  const min = rawMin - padding;
  const range = max - min;

  const width = 300;
  const height = 30;
  const stepX = width / (data.length - 1);
  
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d[dataKey] - min) / range) * height;
    return `${x},${y}`;
  }).join(" L ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-10 mt-3 preserve-3d">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${height} L ${points} L ${width},${height}`} fill={`${color}15`} stroke="none" />
    </svg>
  );
}

// --- REAL TREND CHART WITH AXES AND LABELS ---
function RealTrendChart({ data, dataKey, color, unit }: { data: Array<any>; dataKey: string; color: string; unit: string }) {
  if (!data || data.length < 2) return <div className="text-white/50 text-sm h-full flex items-center justify-center">Insufficient data to graph</div>;
  
  const values = data.map(d => d[dataKey] || 0);
  const rawMax = Math.max(...values);
  const rawMin = Math.min(...values);
  
  // Create padded range for Y axis
  const padding = (rawMax - rawMin) * 0.1 || 1;
  const max = rawMax + padding;
  const min = rawMin - padding;
  const range = max - min;

  const width = 400;
  const height = 140;
  
  // Leave room for Y-axis labels (left) and X-axis labels (bottom)
  const paddingX = 35; 
  const paddingY = 20; 
  const chartWidth = width - paddingX;
  const chartHeight = height - paddingY;
  
  const stepX = chartWidth / (data.length - 1);
  
  // Generate points mapping to chart boundaries
  const points = data.map((d, i) => {
    const x = paddingX + (i * stepX);
    const y = chartHeight - (((d[dataKey] - min) / range) * chartHeight);
    return `${x},${y}`;
  }).join(" L ");

  // Decide how many X labels to show to prevent crowding
  const labelInterval = Math.ceil(data.length / 5);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <defs>
        <linearGradient id={`gradient-${dataKey}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.4 }} />
          <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.0 }} />
        </linearGradient>
      </defs>

      {/* Grid Lines & Y Axis Labels */}
      {[0, 0.5, 1].map((ratio, index) => {
        const y = chartHeight - (chartHeight * ratio);
        const val = (min + (range * ratio)).toFixed(1);
        return (
          <g key={`grid-y-${index}`}>
            <line x1={paddingX} y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={paddingX - 8} y={y + 4} fill="rgba(255,255,255,0.5)" fontSize="10" textAnchor="end">{val}{unit}</text>
          </g>
        );
      })}

      {/* X Axis Labels */}
      {data.map((d, i) => {
        if (i % labelInterval === 0 || i === data.length - 1) {
          const x = paddingX + (i * stepX);
          return (
             <text key={`label-x-${i}`} x={x} y={height} fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle">
               {d.label}
             </text>
          );
        }
        return null;
      })}

      {/* The Line and Fill */}
      <polyline 
        points={`${paddingX},${chartHeight} L ${points} L ${width},${chartHeight}`} 
        fill={`url(#gradient-${dataKey})`} 
        stroke="none" 
      />
      <polyline 
        points={points} 
        fill="none" 
        stroke={color} 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      
      {/* Data Points (Dots) on Line */}
      {data.map((d, i) => {
        const x = paddingX + (i * stepX);
        const y = chartHeight - (((d[dataKey] - min) / range) * chartHeight);
        return (
          <circle key={`dot-${i}`} cx={x} cy={y} r="3" fill="#000" stroke={color} strokeWidth="1.5" />
        );
      })}
    </svg>
  );
}

// --- MAIN COMPONENT ---
export default function WeatherDashboard() {
  const [sensorData, setSensorData] = useState<any>(null);
  const [dangerWarning, setDangerWarning] = useState<any>(null);
  const [predictions, setPredictions] = useState<any>(null);
  const [mlData, setMlData] = useState<any>(null);
  const [rawHistory, setRawHistory] = useState<Record<string, any>>({});
  
  const [showGraphs, setShowGraphs] = useState(false);
  const [trendMode, setTrendMode] = useState<"hourly" | "daily">("hourly");
  const [isMounted, setIsMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Mark as mounted on client only & set up time updates
  useLayoutEffect(() => {
    setIsMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleString([], { 
          weekday: "short", 
          month: "short", 
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Firebase listeners
  useEffect(() => {
    const sensorsRef = ref(db, "ESP32_agent/sensor_readings");
    const dangerWarningRef = ref(db, "ESP32_agent/danger_warnings");
    const predictionsRef = ref(db, "ESP32_agent/predictions");
    const historyRef = ref(db, "ESP32_agent/history");
    const mlRef = ref(db, "ML_Module/Live_Forecast");

    const unsubscribeSensors = onValue(sensorsRef, (snapshot) => setSensorData(snapshot.val() || {}));
    const unsubscribeDanger = onValue(dangerWarningRef, (snapshot) => setDangerWarning(snapshot.val() || {}));
    const unsubscribePredictions = onValue(predictionsRef, (snapshot) => setPredictions(snapshot.val() || {}));
    const unsubscribeHistory = onValue(historyRef, (snapshot) => setRawHistory(snapshot.val() || {}));
    const unsubscribeML = onValue(mlRef, (snapshot) => setMlData(snapshot.val() || {}));

    return () => {
      unsubscribeSensors();
      unsubscribeDanger();
      unsubscribePredictions();
      unsubscribeHistory();
      unsubscribeML();
    };
  }, []);

  // Process History (Memoized so it only recalculates when new history arrives)
  const { hourly: historyHourly, daily: historyDaily } = useMemo(() => {
    return processSensorHistory(rawHistory);
  }, [rawHistory]);

  // Derived values
  const currentConditionsText: string = predictions?.forecast || "";
  const dangerStatus: string = mlData?.["Danger Levels"]?.["Status"] || "";
  const dangerDefinition: string = mlData?.["Danger Levels"]?.["Definition"] || "Awaiting the latest assessment from the prediction model.";
  const dangerConfig = getDangerLevelConfig(dangerStatus);
  const systemStatus: string = dangerWarning?.status || "";

  const isRainy = currentConditionsText.toLowerCase().includes("rain") || mlData?.["Forcast"]?.["Hour_01"]?.toLowerCase?.().includes("rain") || false;
  const isCloudy = currentConditionsText.toLowerCase().includes("cloud") || mlData?.["Forcast"]?.["Hour_01"]?.toLowerCase?.().includes("cloud") || false;
  const isNight = isMounted ? (new Date().getHours() < 6 || new Date().getHours() > 18) : false;
  const feelsLike = getFeelsLike(sensorData?.avg_temp || 0, sensorData?.avg_humidity || 0);
  const rainProbability = Math.min(100, Math.max(0, (sensorData?.avg_humidity || 0) * 0.8 + (sensorData?.avg_pressure || 1013 - 1000) * 2));

  // Determine active trend data (last 24 hours or last 7 days)
  const activeTrendData = trendMode === "hourly" 
    ? historyHourly.slice(-24) 
    : historyDaily.slice(-7);

  const getNextHourLabel = (offset: number) => {
    if (!isMounted) return `+${offset}h`; 
    const now = new Date();
    now.setHours(now.getHours() + offset);
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  const glassPanel = "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl hover:bg-white/10 transition-colors duration-300";

  return (
    <main className="relative w-full min-h-screen bg-black/50 overflow-hidden">
      <WeatherAnimation isRainy={isRainy} isCloudy={isCloudy} isNight={isNight} />

      <div className="relative z-10 w-full h-full">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="px-4 md:px-8 pt-6 md:pt-8 pb-4 md:pb-6 border-b border-white/5 backdrop-blur-sm"
        >
          <div className="max-w-7xl mx-auto flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-700 text-white tracking-tight">WMNDP</h1>
              <p className="text-sm text-white/50 mt-1">Sri Lankan Weather Monitoring &amp; Disaster Prediction Tool</p>
            </div>

            <div className="flex flex-col md:flex-row items-end gap-3">
              {isMounted && currentTime && (
                <div className="text-right">
                  <div className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60 mb-1">System Time</div>
                  <div className="font-300 text-white md:text-lg">{currentTime}</div>
                </div>
              )}

              {isMounted && systemStatus && (
                <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5">
                  <span className="relative flex h-2 w-2">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                      style={{ backgroundColor: getDangerLevelConfig(systemStatus).color }}
                    />
                    <span
                      className="relative inline-flex rounded-full h-2 w-2"
                      style={{ backgroundColor: getDangerLevelConfig(systemStatus).color }}
                    />
                  </span>
                  <Radio className="w-3.5 h-3.5 text-white/50" />
                  <span className="text-xs font-500 text-white/70">Sensor Node: <span className="text-white/90">{systemStatus}</span></span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="px-4 md:px-8 py-8 md:py-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">

              {/* ========== ROW 1: LIVE READINGS ========== */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0 }}
                className={`${glassPanel} p-6 md:p-8 lg:col-span-2 min-h-[320px] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60 block mb-1">Current Temperature</span>
                      <h2 className="text-6xl md:text-7xl font-300 text-white tracking-tighter">
                        {sensorData?.avg_temp?.toFixed(1) || "--"}°
                      </h2>
                    </div>
                    <Thermometer className="w-8 h-8 text-white/60" />
                  </div>
                  
                  <div className="space-y-2 border-t border-white/10 pt-5">
                    <div className="flex justify-between items-center text-white/80">
                      <span className="text-xs md:text-sm font-500">Feels Like</span>
                      <span className="text-xl md:text-2xl font-300">{feelsLike}°</span>
                    </div>
                  </div>
                </div>

                <MiniSparkline data={activeTrendData} dataKey="avg_temp" color="#ffffff" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.05 }}
                className={`${glassPanel} p-6 md:p-7 min-h-[300px] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60">Humidity</span>
                    <Droplets className="w-5 h-5 text-white/60" />
                  </div>
                  <div className="text-5xl md:text-6xl font-300 text-white tracking-tight mb-2">
                    {sensorData?.avg_humidity?.toFixed(0) || "--"}
                    <span className="text-2xl md:text-3xl text-white/50 ml-1">%</span>
                  </div>
                  <p className="text-xs md:text-sm text-white/60 mt-3">Moisture level</p>
                </div>
                <MiniSparkline data={activeTrendData} dataKey="avg_humidity" color="#ffffff" />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }}
                className={`${glassPanel} p-6 md:p-7 min-h-[300px] flex flex-col justify-between`}
              >
                <div className="space-y-5">
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60">Pressure</span>
                      <Gauge className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="text-4xl md:text-5xl font-300 text-white">
                      {sensorData?.avg_pressure?.toFixed(0) || "--"}
                      <span className="text-lg md:text-xl text-white/50 ml-1">hPa</span>
                    </div>
                  </div>

                  <div className="border-t border-white/10 pt-4">
                    <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60 block mb-2">Soil Moisture</span>
                    <div className="text-3xl font-300 text-white">{sensorData?.median_soil || "0"}%</div>
                  </div>
                </div>
              </motion.div>

              {/* ========== ROW 2: ML DANGER ASSESSMENT ========== */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={`${glassPanel} p-8 md:p-10 lg:col-span-2 relative overflow-hidden flex flex-col justify-center items-center gap-6`}
                style={{
                  boxShadow: isMounted ? `0 0 60px -15px ${dangerConfig.glow}` : undefined,
                  borderColor: isMounted ? `${dangerConfig.color}33` : undefined,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none transition-colors duration-700"
                  style={{ background: `radial-gradient(circle at 50% 50%, ${dangerConfig.soft}, transparent 70%)` }}
                />

                <div className="relative flex flex-col items-center justify-center gap-3 z-10">
                  <div className="relative w-36 h-36 md:w-40 md:h-40 flex items-center justify-center">
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: dangerConfig.color }}
                      animate={{ opacity: [0.35, 0.05, 0.35], scale: [1, 1.35, 1] }}
                      transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
                    />
                    <div
                      className="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex flex-col items-center justify-center text-center border-4 shadow-2xl"
                      style={{
                        backgroundColor: `${dangerConfig.color}25`,
                        borderColor: dangerConfig.color,
                      }}
                    >
                      <ShieldAlert className="w-7 h-7 md:w-8 md:h-8 mb-1" style={{ color: dangerConfig.color }} />
                      <span
                        className="text-lg md:text-xl font-700 uppercase tracking-wide leading-tight px-2"
                        style={{ color: dangerConfig.color }}
                      >
                        {isMounted ? dangerConfig.label : "—"}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs md:text-sm font-600 uppercase tracking-widest text-white/60 mt-2">
                    Danger Level
                  </span>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`${glassPanel} p-6 md:p-7 lg:col-span-2 min-h-[300px] flex flex-col justify-between`}
              >
                <div>
                  <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60 block mb-3">
                    Assessment
                  </span>
                  <p className="text-base md:text-lg font-400 text-white leading-relaxed mb-4">
                    {isMounted ? dangerDefinition : "Loading latest disaster prediction..."}
                  </p>
                </div>

                {mlData?.calculated_at && (
                  <div className="flex items-center gap-2 text-xs text-white/40 border-t border-white/10 pt-4">
                    <Clock className="w-3.5 h-3.5" />
                    Assessed {mlData.calculated_at}
                  </div>
                )}
              </motion.div>

              {/* ========== ROW 3: WEATHER CONDITIONS ========== */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.25 }}
                className={`${glassPanel} p-6 md:p-7 min-h-[300px] flex flex-col justify-between`}
              >
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs md:text-sm font-600 uppercase tracking-wider text-white/60">Precipitation</span>
                    <PremiumWeatherIcon type={currentConditionsText || "rain"} className="w-5 h-5" />
                  </div>
                  
                  <div className="mb-5">
                    <div className="text-5xl md:text-6xl font-300 text-white">
                      {rainProbability.toFixed(0)}
                      <span className="text-2xl md:text-3xl text-white/50 ml-1">%</span>
                    </div>
                  </div>

                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-400 to-cyan-400 h-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${rainProbability}%` }}
                      transition={{ duration: 1.5 }}
                    />
                  </div>

                  {currentConditionsText && (
                    <p className="text-xs md:text-sm text-white/60 leading-relaxed">{currentConditionsText}</p>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }}
                className={`${glassPanel} p-6 md:p-8 lg:col-span-3`}
              >
                <div className="flex items-center gap-2 text-white/60 text-xs md:text-sm font-600 tracking-wider uppercase mb-6">
                  <Clock className="w-4 h-4" /> 4-Hour Forecast
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 border-t border-white/10 pt-6">
                  {isMounted && ["Hour_01", "Hour_02", "Hour_03", "Hour_04"].map((hourKey, index) => {
                    const rawString = mlData?.["Forcast"]?.[hourKey] || "Analyzing...";
                    const cleanPrediction = rawString.includes(": ") ? rawString.split(": ")[1] : rawString;
                    const actualTime = getNextHourLabel(index + 1);
                    
                    return (
                      <motion.div 
                        key={hourKey}
                        whileHover={{ y: -4 }}
                        className="bg-white/5 border border-white/10 p-4 md:p-5 rounded-2xl text-center hover:bg-white/10 transition-colors flex flex-col items-center justify-center gap-3"
                      >
                        <span className="text-xs text-white/60 font-500 uppercase tracking-wide">{actualTime}</span>
                        <PremiumWeatherIcon type={cleanPrediction} className="w-12 h-12" />
                        <span className="text-xs md:text-sm font-500 text-white/90 capitalize">{cleanPrediction}</span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* ========== ROW 4: EXPANDING REAL TRENDS ========== */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }}
                className={`lg:col-span-4 ${glassPanel}`}
              >
                <div 
                  className="p-6 md:p-8 flex items-center justify-between cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setShowGraphs(!showGraphs)}
                >
                  <div className="flex items-center gap-3 text-white/80 text-xs md:text-sm font-600 tracking-wider uppercase">
                    <Activity className="w-5 h-5" /> 
                    Historical Real Trends
                  </div>
                  <motion.div animate={{ rotate: showGraphs ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-5 h-5 text-white/60" />
                  </motion.div>
                </div>

                <AnimatePresence>
                  {showGraphs && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }} 
                      animate={{ height: "auto", opacity: 1 }} 
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 md:px-8 pb-8 border-t border-white/10"
                    >
                      <div className="flex gap-2 mt-6 mb-6 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
                        {["hourly", "daily"].map((mode) => (
                          <button 
                            key={mode}
                            onClick={() => setTrendMode(mode as "hourly" | "daily")}
                            className={`px-4 py-2 rounded-lg text-xs font-600 tracking-wider uppercase transition-all ${
                              trendMode === mode 
                                ? "bg-white text-black shadow-lg" 
                                : "text-white/60 hover:text-white"
                            }`}
                          >
                            {mode === "hourly" ? "Hourly (24H)" : "Daily (7D)"}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-xs text-white/60 font-600 uppercase tracking-wider">Temperature Trend</span>
                          </div>
                          <div className="h-40 md:h-56 w-full">
                            {activeTrendData.length > 1 ? (
                              <RealTrendChart data={activeTrendData} dataKey="avg_temp" color="#60A5FA" unit="°" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                                Collecting sufficient {trendMode} data...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6">
                          <div className="flex justify-between items-center mb-6">
                            <span className="text-xs text-white/60 font-600 uppercase tracking-wider">Humidity Trend</span>
                          </div>
                          <div className="h-40 md:h-56 w-full">
                            {activeTrendData.length > 1 ? (
                              <RealTrendChart data={activeTrendData} dataKey="avg_humidity" color="#34D399" unit="%" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/40 text-sm">
                                Collecting sufficient {trendMode} data...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

            </div>
          </div>
        </div>
      </div>

      <style>{globalStyles}</style>
    </main>
  );
}