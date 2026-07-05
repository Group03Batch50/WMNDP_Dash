"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseconfig";
import { 
  Thermometer, 
  Droplets, 
  Gauge, 
  Cpu,
  Clock,
  CloudRain,
  Calendar,
  ChevronDown,
  ChevronUp,
  Activity,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

// --- DYNAMIC VECTOR WEATHER ANIMATION (Day/Night Cycle) ---
function WeatherAnimation({ isRainy, isNight }: { isRainy: boolean, isNight: boolean }) {
  const skyGradient = isRainy
    ? (isNight ? "bg-gradient-to-b from-gray-950 via-slate-900 to-zinc-900" : "bg-gradient-to-b from-slate-700 via-slate-600 to-zinc-500")
    : (isNight ? "bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-900" : "bg-gradient-to-b from-sky-400 via-blue-200 to-emerald-50/20");

  const hillFar = isRainy ? (isNight ? "#0f172a" : "#475569") : (isNight ? "#1e293b" : "#10b981");
  const hillMid = isRainy ? (isNight ? "#020617" : "#334155") : (isNight ? "#0f172a" : "#059669");
  const hillClose = isRainy ? (isNight ? "#000000" : "#1e293b") : (isNight ? "#020617" : "#047857");

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
      <div className={`absolute inset-0 transition-colors duration-1000 ${skyGradient}`} />

      {!isRainy && (
        isNight ? (
          <motion.div 
            className="absolute top-16 right-16 md:right-32 w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.4)] opacity-90"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          >
            <div className="absolute top-4 left-4 w-4 h-4 bg-slate-200/50 rounded-full blur-[1px]" />
            <div className="absolute bottom-6 right-6 w-6 h-6 bg-slate-200/40 rounded-full blur-[1px]" />
          </motion.div>
        ) : (
          <motion.div 
            className="absolute top-16 right-20 md:right-40 w-28 h-28 md:w-36 md:h-36 bg-amber-200 rounded-full blur-xl opacity-60"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        )
      )}

      <div className="absolute top-12 inset-x-0 h-44 opacity-40">
        <motion.div 
          className={`absolute left-[-20%] w-56 h-16 rounded-full blur-sm ${isNight ? 'bg-slate-800' : 'bg-white'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 45, ease: "linear" }}
        />
        <motion.div 
          className={`absolute left-[-40%] top-14 w-72 h-20 rounded-full blur-sm ${isNight ? 'bg-slate-800/80' : 'bg-white/80'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear", delay: 8 }}
        />
        {isRainy && (
          <motion.div 
            className={`absolute left-[-25%] top-4 w-64 h-24 rounded-full blur-md ${isNight ? 'bg-zinc-900' : 'bg-slate-600'}`}
            animate={{ x: ["0vw", "130vw"] }}
            transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
          />
        )}
      </div>

      {isRainy && (
        <div className="absolute inset-0 opacity-40 z-10">
          {[...Array(35)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-[1.5px] h-14 rounded ${isNight ? 'bg-slate-400/50' : 'bg-blue-200/70'}`}
              style={{ left: `${Math.random() * 100}%`, top: `-60px` }}
              animate={{ y: ["0vh", "110vh"], x: ["0px", "-35px"] }}
              transition={{ repeat: Infinity, duration: 0.7 + Math.random() * 0.5, delay: Math.random() * 2, ease: "linear" }}
            />
          ))}
        </div>
      )}

      <div className="absolute bottom-0 w-full h-[45vh] min-h-[320px]">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '115%' }} preserveAspectRatio="none">
          <path fill={hillFar} fillOpacity={isRainy ? "0.6" : "0.4"} d="M0,160 C320,220 640,110 960,190 C1280,270 1360,170 1440,210 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>
        
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '95%' }} preserveAspectRatio="none">
          <path fill={hillMid} fillOpacity={isRainy ? "0.8" : "0.6"} d="M0,210 C360,130 720,280 1080,190 C1260,145 1360,220 1440,180 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>

        <div className="absolute bottom-[12%] left-[50%] -translate-x-1/2 w-28 h-44 flex flex-col items-center justify-end z-20 opacity-90 transform scale-75 md:scale-100">
          <motion.div className="relative w-16 h-32 flex flex-col items-center" animate={{ y: [0, -3.5, 0], rotate: [0, 0.8, -0.8, 0] }} transition={{ repeat: Infinity, duration: 0.65, ease: "easeInOut" }}>
            {isRainy && (
              <>
                <motion.div className="absolute -top-7 w-26 h-12 bg-yellow-500 rounded-t-full shadow-md z-30 flex items-center justify-center" animate={{ rotate: [-2.5, 2.5, -2.5] }} transition={{ repeat: Infinity, duration: 1.3, ease: "easeInOut" }}>
                  <div className="w-0.5 h-3 bg-yellow-700 absolute -top-2 rounded-full" />
                </motion.div>
                <div className="absolute top-3 w-0.5 h-15 bg-zinc-800 left-[54%] z-10" />
              </>
            )}
            <div className={`w-6 h-6 rounded-full ${isRainy ? 'bg-yellow-600' : (isNight ? 'bg-amber-100/70' : 'bg-amber-100/95')} z-10`} />
            <div className={`w-7.5 h-15 rounded-b-xl -mt-1 relative ${isRainy ? "bg-yellow-500 shadow-sm" : (isNight ? "bg-blue-800" : "bg-blue-600")} transition-colors duration-1000`} />
            <div className="w-7 h-9 flex justify-around -mt-0.5">
              <motion.div className={`w-1.5 h-8 ${isRainy ? 'bg-yellow-700' : 'bg-zinc-800'} rounded-b`} animate={{ rotate: [-18, 22, -18] }} transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }} style={{ transformOrigin: "top center" }} />
              <motion.div className={`w-1.5 h-8 ${isRainy ? 'bg-yellow-700' : 'bg-zinc-800'} rounded-b`} animate={{ rotate: [22, -18, 22] }} transition={{ repeat: Infinity, duration: 0.65, ease: "linear" }} style={{ transformOrigin: "top center" }} />
            </div>
          </motion.div>
        </div>

        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '65%' }} preserveAspectRatio="none">
          <path fill={hillClose} d="M0,250 C440,290 880,210 1440,270 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>
      </div>
    </div>
  );
}

// --- SCALABLE LINE CHART COMPONENT ---
function LineChart({ data, dataKey, color, unit }: { data: any[], dataKey: string, color: string, unit: string }) {
  const values = data.map((d) => d[dataKey] || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 800;
  const height = 200;
  const paddingX = 40; 
  const paddingY = 50; 
  const usableWidth = width - 2 * paddingX;
  const usableHeight = height - 2 * paddingY;
  
  const stepX = usableWidth / (data.length - 1 || 1);
  
  const points = data.map((d, i) => {
    const x = paddingX + i * stepX;
    const y = height - paddingY - ((d[dataKey] - min) / range) * usableHeight;
    return { x, y, val: d[dataKey] };
  });

  const pathD = `M ${points.map((p) => `${p.x},${p.y}`).join(" L ")}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
      <path 
        d={pathD} 
        fill="none" 
        stroke={color} 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="opacity-80" 
        style={{ filter: `drop-shadow(0px 8px 10px ${color}30)` }}
      />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="6" fill="#0f172a" stroke={color} strokeWidth="3" />
          <text 
            x={p.x} 
            y={p.y - 18} 
            fill="#e2e8f0" 
            fontSize="18" 
            textAnchor="middle" 
            fontWeight="bold" 
            className="drop-shadow-lg tracking-wide"
          >
            {p.val.toFixed(1)}{unit}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function Dashboard() {
  const [sensorData, setSensorData] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any>(null);
  const [edgeForecast, setEdgeForecast] = useState<string>("Analyzing...");
  const [mlData, setMlData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showMinMax, setShowMinMax] = useState<boolean>(false);
  const [showGraphs, setShowGraphs] = useState<boolean>(false);
  
  const [rainProbability, setRainProbability] = useState<number>(0);
  const [trends, setTrends] = useState({ temp: 0, humidity: 0, pressure: 0 });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const sensorRef = ref(db, "ESP32_agent/sensor_readings");
    const unsubscribeSensors = onValue(sensorRef, (snapshot) => { if (snapshot.val()) setSensorData(snapshot.val()); });
    const historyRef = ref(db, "ESP32_agent/history");
    const unsubscribeHistory = onValue(historyRef, (snapshot) => { if (snapshot.val()) setHistoryData(snapshot.val()); });
    const edgeRef = ref(db, "ESP32_agent/predictions/forecast");
    const unsubscribeEdge = onValue(edgeRef, (snapshot) => { if (snapshot.val()) setEdgeForecast(snapshot.val()); });
    const mlRef = ref(db, "ML_Module/Live_Forecast");
    const unsubscribeMl = onValue(mlRef, (snapshot) => { 
      if (snapshot.val()) { setMlData(snapshot.val()); setLoading(false); }
    });
    return () => { clearInterval(timer); unsubscribeSensors(); unsubscribeHistory(); unsubscribeEdge(); unsubscribeMl(); };
  }, []);

  useEffect(() => {
    if (sensorData && historyData && typeof historyData === 'object') {
      const historyEntries = Object.values(historyData) as any[];
      if (historyEntries.length >= 2) {
        const latest = historyEntries[historyEntries.length - 1];
        const older = historyEntries[Math.max(0, historyEntries.length - 6)]; 
        setTrends({
          temp: (latest?.avg_temp || 0) - (older?.avg_temp || 0),
          humidity: (latest?.avg_humidity || 0) - (older?.avg_humidity || 0),
          pressure: (latest?.avg_pressure || 0) - (older?.avg_pressure || 0)
        });
      }
      let prob = 0;
      if (sensorData.avg_humidity > 85) prob += 50;
      else if (sensorData.avg_humidity > 70) prob += 25;
      else if (sensorData.avg_humidity > 50) prob += 10;
      if (sensorData.avg_pressure && sensorData.avg_pressure < 1005) prob += 30;
      else if (sensorData.avg_pressure && sensorData.avg_pressure < 1012) prob += 15;
      if (trends.pressure < -1.5) prob += 20; 
      setRainProbability(Math.min(100, prob));
    }
  }, [sensorData, historyData]);

  const generate7DayHistory = () => {
    const defaultTemp = sensorData?.avg_temp || 28; 
    const defaultHum = sensorData?.avg_humidity || 75; 
    const rawHistory = historyData ? Object.values(historyData) : [];
    
    let processedPoints = [];

    if (rawHistory.length === 0) {
      for (let i = 0; i < 7; i++) {
        processedPoints.push({ avg_temp: defaultTemp, avg_humidity: defaultHum, label: i === 6 ? 'Now' : `Day -${6 - i}` });
      }
    } else {
      const last7 = rawHistory.slice(-7) as any[];
      const missingCount = 7 - last7.length;
      
      const oldestRecord = last7[0];
      for (let i = 0; i < missingCount; i++) {
        processedPoints.push({
          avg_temp: oldestRecord.avg_temp ?? defaultTemp,
          avg_humidity: oldestRecord.avg_humidity ?? defaultHum,
          label: `Day -${6 - i}`
        });
      }
      last7.forEach((pt, index) => {
        const dayOffset = last7.length - 1 - index;
        processedPoints.push({
          avg_temp: pt.avg_temp ?? defaultTemp,
          avg_humidity: pt.avg_humidity ?? defaultHum,
          label: dayOffset === 0 ? 'Now' : `Day -${dayOffset}`
        });
      });
    }
    return processedPoints;
  };

  const getNextHourLabel = (offsetHours: number) => {
    const futureDate = new Date(currentTime);
    futureDate.setHours(futureDate.getHours() + offsetHours);
    futureDate.setMinutes(0);
    return futureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const renderTrendIcon = (diff: number, threshold: number = 0.5) => {
    if (diff > threshold) return <TrendingUp className="w-4 h-4 text-emerald-400" aria-label="Rising" />;
    if (diff < -threshold) return <TrendingDown className="w-4 h-4 text-rose-400" aria-label="Falling" />;
    return <Minus className="w-4 h-4 text-gray-500" aria-label="Stable" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-gray-500 sf-pro">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs tracking-widest uppercase text-center px-4">
          Establishing Secure Node Data Links...
        </motion.div>
      </div>
    );
  }

  const systemStatus = mlData?.["Danger Levels"]?.Status || "Green";
  const isSafe = systemStatus.toLowerCase() === "green";
  const isRainy = rainProbability >= 40 || !isSafe;
  const currentHour = currentTime.getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  const historyArray7Days = generate7DayHistory();

  return (
    <main className="relative min-h-screen text-gray-200 selection:bg-blue-500/30 overflow-x-hidden bg-slate-950">
      
      <style dangerouslySetInnerHTML={{__html: `
        @font-face {
          font-family: 'Lemon Milk';
          src: url('/fonts/lemon-milk.woff2') format('woff2'); 
          font-weight: 900;
          font-style: normal;
        }
        .font-lemon-milk {
          font-family: 'Lemon Milk', sans-serif;
          font-weight: 900;
        }
        /* Inject SF Pro Display Globally */
        body, main {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
      `}} />

      <WeatherAnimation isRainy={isRainy} isNight={isNight} />
      <div className="absolute inset-0 bg-slate-950/40 mix-blend-multiply z-0 pointer-events-none"></div>

      <div className="relative z-10 p-4 sm:p-6 md:p-12">
        <header className="max-w-6xl mx-auto mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-1">
              <Cpu className="w-3.5 h-3.5" /> Sri Lankan Weather Monitoring and Disaster Prediction System
            </div>
            <h1 className="text-4xl md:text-5xl tracking-widest mb-3 md:mb-4 font-lemon-milk text-white">WMNDP</h1>
            <div className="bg-slate-900/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 text-[10px] md:text-xs text-gray-300 inline-flex items-center gap-3">
              System Status: 
              <span className={`font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isSafe ? "text-emerald-400" : "text-amber-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSafe ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                {systemStatus}
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto md:text-right bg-slate-900/30 px-5 py-4 md:px-6 rounded-3xl backdrop-blur-md border border-white/5">
            <div className="text-3xl md:text-5xl font-light tracking-tighter mb-1 font-mono text-white">
              {formattedTime}
            </div>
            <div className="flex items-center md:justify-end gap-2 text-[10px] md:text-xs text-gray-400 font-mono">
              <Calendar className="w-3.5 h-3.5 text-blue-300" /> {formattedDate}
            </div>
          </div>
        </header>

        {/* --- Live Prediction Banner --- */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="max-w-6xl mx-auto mb-6 bg-slate-900/60 backdrop-blur-xl border border-blue-500/20 p-5 md:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
        >
          <div className="bg-blue-500/20 p-4 rounded-2xl text-blue-300 shadow-inner flex-shrink-0">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-blue-300 text-[10px] md:text-xs font-bold tracking-widest uppercase mb-1.5 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Live prediction
            </h3>
            <p className="text-xl sm:text-2xl md:text-3xl font-light text-white tracking-tight leading-snug">{edgeForecast}</p>
          </div>
        </motion.div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Sensor Cards */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} onClick={() => setShowMinMax(!showMinMax)} className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08] p-5 md:p-6 rounded-3xl cursor-pointer transition-all select-none group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-xs md:text-sm font-medium">Avg Temperature</span>
              <Thermometer className="text-gray-300 w-4 h-4 group-hover:text-orange-300 transition-colors" />
            </div>
            <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 flex items-baseline gap-1 md:gap-2 text-white">
              {sensorData?.avg_temp?.toFixed(1) || "--"}
              <span className="text-xl md:text-2xl text-gray-500">°C</span>
              <div className="ml-auto flex items-center gap-1 text-[10px] md:text-xs text-gray-500 bg-black/20 px-2 py-1 rounded-md tracking-wide">
                Trend {renderTrendIcon(trends.temp, 0.3)}
              </div>
            </div>
            <AnimatePresence>
              {showMinMax ? (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-[10px] md:text-xs text-gray-400 flex justify-between pt-3 border-t border-white/5 mt-3 overflow-hidden">
                  <span>Min: {sensorData?.min_temp?.toFixed(1)}°C</span>
                  <span>Max: {sensorData?.max_temp?.toFixed(1)}°C</span>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] md:text-[11px] text-gray-500 flex items-center gap-1 mt-3">
                  Tap for extremities <ChevronDown className="w-3 h-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08] p-5 md:p-6 rounded-3xl transition-all group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-xs md:text-sm font-medium">Humidity</span>
              <Droplets className="text-gray-300 w-4 h-4 group-hover:text-blue-300 transition-colors" />
            </div>
            <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 flex items-baseline text-white">
              {sensorData?.avg_humidity?.toFixed(1) || "--"}
              <span className="text-xl md:text-2xl text-gray-500 ml-1">%</span>
              <div className="ml-auto flex items-center gap-1 text-[10px] md:text-xs text-gray-500 bg-black/20 px-2 py-1 rounded-md tracking-wide">
                Trend {renderTrendIcon(trends.humidity, 2.0)}
              </div>
            </div>
            <div className="text-[10px] md:text-[11px] text-gray-400 bg-white/5 border border-white/5 inline-block px-2 py-0.5 rounded-md mt-2">
              Atmospheric Status: Active
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08] p-5 md:p-6 rounded-3xl flex flex-col justify-between gap-4 transition-all group">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-400 text-xs md:text-sm font-medium">Barometric Pressure</span>
                <Gauge className="text-gray-300 w-4 h-4 group-hover:text-purple-300 transition-colors" />
              </div>
              <div className="flex justify-between items-end">
                <div className="text-2xl md:text-3xl font-light font-mono text-white">
                  {sensorData?.avg_pressure?.toFixed(1) || "--"} <span className="text-xs md:text-sm text-gray-500">hPa</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] md:text-xs text-gray-500 bg-black/20 px-2 py-1 rounded-md">
                  {renderTrendIcon(trends.pressure, 1.0)}
                </div>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3">
              <div className="text-gray-400 text-[10px] md:text-[11px] font-medium mb-0.5">Soil Moisture</div>
              <div className="text-lg md:text-xl font-light font-mono text-gray-300">
                {sensorData?.median_soil || "0"}
                <span className="text-[10px] md:text-xs text-gray-600 ml-1">% Moisture</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900/40 backdrop-blur-xl border border-white/[0.04] hover:bg-slate-800/40 hover:border-white/[0.08] p-5 md:p-6 rounded-3xl transition-all group">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-400 text-xs md:text-sm font-medium">Possibility of Rain</span>
              <CloudRain className="text-gray-300 w-4 h-4 group-hover:text-indigo-300 transition-colors" />
            </div>
            <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 text-white">
              {rainProbability}
              <span className="text-xl md:text-2xl text-gray-500 ml-1">%</span>
            </div>
            <div className="text-[10px] md:text-[11px] text-gray-400 bg-white/5 border border-white/5 inline-block px-2 py-0.5 rounded-md mt-2">
              Driven by historical logic nodes
            </div>
          </motion.div>

          {/* ML Forecast (MOVED ABOVE TRENDS, ALWAYS OPEN) */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-4 bg-slate-900/40 border border-white/[0.04] rounded-3xl overflow-hidden p-5 md:p-8 select-none">
            <div className="flex items-center gap-2 text-gray-300 text-xs md:text-sm font-semibold tracking-wider uppercase mb-5 md:mb-6">
              <Clock className="w-4 h-4 text-gray-400" /> forecast for the next 4hrs
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 border-t border-white/5 pt-5 md:pt-6">
              {["Hour_01", "Hour_02", "Hour_03", "Hour_04"].map((hourKey, index) => {
                const rawString = mlData?.["Forcast"]?.[hourKey] || "Processing...";
                const cleanPrediction = rawString.split(": ")[1] || rawString;
                const actualTime = getNextHourLabel(index + 1);
                return (
                  <div key={hourKey} className="bg-black/20 border border-white/5 p-3 md:p-4 rounded-2xl text-center">
                    <span className="text-[10px] md:text-xs text-gray-400 font-bold block mb-1">{actualTime}</span>
                    <span className="text-xs md:text-sm font-light tracking-tight text-gray-200">{cleanPrediction}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-right mt-4 text-[9px] md:text-[10px] text-gray-600 font-mono uppercase tracking-widest">
              Model Run: {mlData?.calculated_at || "N/A"}
            </div>
          </motion.div>

          {/* Expandable 7-Day Historical Graphs */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="lg:col-span-4 bg-slate-900/50 backdrop-blur-xl border border-white/[0.04] rounded-3xl overflow-hidden cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
            onClick={() => setShowGraphs(!showGraphs)}
          >
            <div className="p-5 md:p-8 flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm font-semibold tracking-wider uppercase">
                <div className="bg-black/30 p-2 rounded-full border border-white/5">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> 
                </div>
                trends
              </div>
              {showGraphs ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-500" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />}
            </div>

            <AnimatePresence>
              {showGraphs && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 md:px-8 pb-5 md:pb-8">
                  <div className="border-t border-white/5 pt-5 md:pt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                    
                    {/* Temp 7-Day Line Chart */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                      <div className="text-[9px] md:text-[10px] text-gray-400 font-bold mb-3 md:mb-4 uppercase tracking-widest flex justify-between">
                        <span>Temperature Trend</span> <span>Last 7 Days</span>
                      </div>
                      <div className="h-36 md:h-44 w-full flex items-center justify-center">
                        <LineChart data={historyArray7Days} dataKey="avg_temp" color="#f97316" unit="°C" />
                      </div>
                      <div className="flex justify-between text-[9px] md:text-[11px] text-gray-500 mt-2 font-mono px-2 md:px-4">
                         {historyArray7Days.map((pt, i) => <span key={i} className="text-center w-full">{pt.label}</span>)}
                      </div>
                    </div>

                    {/* Humidity 7-Day Line Chart */}
                    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 md:p-5 flex flex-col justify-between">
                      <div className="text-[9px] md:text-[10px] text-gray-400 font-bold mb-3 md:mb-4 uppercase tracking-widest flex justify-between">
                        <span>Humidity Trend</span> <span>Last 7 Days</span>
                      </div>
                      <div className="h-36 md:h-44 w-full flex items-center justify-center">
                        <LineChart data={historyArray7Days} dataKey="avg_humidity" color="#3b82f6" unit="%" />
                      </div>
                      <div className="flex justify-between text-[9px] md:text-[11px] text-gray-500 mt-2 font-mono px-2 md:px-4">
                         {historyArray7Days.map((pt, i) => <span key={i} className="text-center w-full">{pt.label}</span>)}
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

        </div>
      </div>
    </main>
  );
}