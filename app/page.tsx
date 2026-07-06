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
  Activity
} from "lucide-react";

// --- DYNAMIC APPARENT TEMPERATURE (FEELS LIKE) CALCULATOR ---
function getFeelsLike(t: number, h: number): number {
  if (!t) return 0;
  const e = (h / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
  return parseFloat((t + 0.33 * e - 4.0).toFixed(1));
}

// --- DYNAMIC VECTOR SKY BACKGROUND ---
function WeatherAnimation({ isRainy, isNight }: { isRainy: boolean; isNight: boolean }) {
  const skyGradient = isRainy
    ? (isNight ? "from-gray-950 via-slate-900 to-zinc-900" : "from-slate-600 via-slate-500 to-zinc-400")
    : (isNight ? "from-slate-950 via-indigo-950 to-slate-900" : "from-sky-500 via-blue-400 to-emerald-400/40");

  // Bird flying variants
  const birdVariants = {
    animate: (startY: number) => ({
      x: ["-10vw", "110vw"],
      y: [startY, startY - 15, startY],
      transition: {
        x: { repeat: Infinity, duration: 25 + startY * 0.05, ease: "linear" },
        y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" }
      }
    })
  };

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
      <div className={`absolute inset-0 transition-all duration-1000 bg-gradient-to-b ${skyGradient}`} />

      {/* --- NIGHT LOOK: MOON, CLOUDS & TWINKLING STARS --- */}
      {isNight ? (
        <>
          {/* Twinkling Stars */}
          <div className="absolute inset-0 opacity-60">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  top: `${Math.random() * 45}%`,
                  left: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{
                  repeat: Infinity,
                  duration: 2 + Math.random() * 3,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </div>

          {/* Glowing Moon */}
          <motion.div 
            className="absolute top-16 right-16 md:right-32 w-16 h-16 md:w-20 md:h-20 bg-slate-100 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] opacity-90"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          >
            <div className="absolute top-3 left-3 w-4 h-4 bg-slate-300/40 rounded-full blur-[1px]" />
            <div className="absolute bottom-5 right-5 w-5 h-5 bg-slate-300/30 rounded-full blur-[1px]" />
          </motion.div>
        </>
      ) : (
        /* --- DAY LOOK: SUN, CLOUDS & FLYING BIRDS --- */
        <>
          {/* Radiant Sun */}
          <motion.div 
            className="absolute top-16 right-20 md:right-40 w-24 h-24 md:w-32 md:h-32 bg-amber-200 rounded-full blur-xl opacity-50"
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />

          {/* Flying Birds */}
          {!isRainy && (
            <>
              <motion.div custom={80} variants={birdVariants} animate="animate" className="absolute top-0 left-0 z-10">
                <motion.svg animate={{ scaleY: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.5, ease: "easeInOut" }} width="18" height="10" viewBox="0 0 20 10" className="stroke-white/40 stroke-[2px] fill-none">
                  <path d="M0,6 C4,2 6,2 10,6 C14,2 16,2 20,6" />
                </motion.svg>
              </motion.div>
              <motion.div custom={140} variants={birdVariants} animate="animate" className="absolute top-0 left-0 z-10 animate-delay-1000">
                <motion.svg animate={{ scaleY: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 0.6, ease: "easeInOut", delay: 0.1 }} width="14" height="8" viewBox="0 0 20 10" className="stroke-white/35 stroke-[2px] fill-none">
                  <path d="M0,6 C4,2 6,2 10,6 C14,2 16,2 20,6" />
                </motion.svg>
              </motion.div>
            </>
          )}
        </>
      )}

      {/* --- DRIFTING CLOUDS OVERLAY --- */}
      <div className="absolute top-12 inset-x-0 h-44 opacity-30">
        <motion.div 
          className={`absolute left-[-20%] w-64 h-20 rounded-full blur-md ${isNight ? 'bg-slate-800' : 'bg-white'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        />
        <motion.div 
          className={`absolute left-[-40%] top-16 w-80 h-24 rounded-full blur-lg ${isNight ? 'bg-slate-900/80' : 'bg-white/70'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 65, ease: "linear", delay: 10 }}
        />
      </div>

      {/* --- RAIN EFFECT --- */}
      {isRainy && (
        <div className="absolute inset-0 opacity-30 z-10">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-[1.5px] h-12 rounded ${isNight ? 'bg-slate-400/40' : 'bg-blue-100/60'}`}
              style={{ left: `${Math.random() * 100}%`, top: `-50px` }}
              animate={{ y: ["0vh", "110vh"], x: ["0px", "-20px"] }}
              transition={{ repeat: Infinity, duration: 0.8 + Math.random() * 0.4, delay: Math.random() * 2, ease: "linear" }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// --- STYLED CONTAINED MINI TREND GRAPH ---
function MiniSparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data || data.length < 2) return <div className="h-10 w-full mt-4 bg-white/5 rounded-2xl" />;
  const values = data.map(d => d[dataKey] || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min === 0 ? 1 : max - min;

  const width = 300;
  const height = 24;
  const stepX = width / (data.length - 1);
  
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d[dataKey] - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="w-full mt-5 bg-white/5 border border-white/10 rounded-2xl p-2.5 overflow-hidden flex items-center justify-center shadow-inner">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-5 overflow-visible opacity-80" preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    </div>
  );
}

// --- MAIN TRENDS EXPANDABLE WAVEFORM CHART ---
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
  const [trendMode, setTrendMode] = useState<"hourly" | "daily">("hourly");
  
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
      setRainProbability(Math.min(100, prob));
    }
  }, [sensorData, historyData]);

  const getSparklineArray = (key: string, fallback: number) => {
    if (!historyData) return Array(6).fill({ [key]: fallback });
    return Object.values(historyData).slice(-6).map((pt: any) => ({ [key]: pt[key] ?? fallback }));
  };

  const generate7DayHistory = () => {
    const defaultTemp = sensorData?.avg_temp || 28; 
    const defaultHum = sensorData?.avg_humidity || 75; 
    const rawHistory = historyData ? Object.values(historyData) : [];
    
    let processedPoints = [];
    const pointsCount = trendMode === "hourly" ? 6 : 7;

    // Helper to calculate exact relative time/day dynamically
    const getDynamicLabel = (offset: number) => {
      if (offset === 0) return "Now";
      const targetDate = new Date(currentTime.getTime());
      
      if (trendMode === "hourly") {
        targetDate.setHours(targetDate.getHours() - offset);
        return targetDate.toLocaleTimeString([], { hour: 'numeric', hour12: true }).toLowerCase(); // e.g. "10 pm"
      } else {
        targetDate.setDate(targetDate.getDate() - offset);
        return targetDate.toLocaleDateString([], { weekday: 'short' }); // e.g. "Sun"
      }
    };

    if (rawHistory.length === 0) {
      for (let i = 0; i < pointsCount; i++) {
        const offset = pointsCount - 1 - i;
        processedPoints.push({ 
          avg_temp: defaultTemp, 
          avg_humidity: defaultHum, 
          label: getDynamicLabel(offset)
        });
      }
    } else {
      const targetHistory = rawHistory.slice(-pointsCount) as any[];
      const missingCount = pointsCount - targetHistory.length;
      
      const oldestRecord = targetHistory[0] || { avg_temp: defaultTemp, avg_humidity: defaultHum };
      for (let i = 0; i < missingCount; i++) {
        const offset = pointsCount - 1 - i;
        processedPoints.push({
          avg_temp: oldestRecord.avg_temp ?? defaultTemp,
          avg_humidity: oldestRecord.avg_humidity ?? defaultHum,
          label: getDynamicLabel(offset)
        });
      }
      targetHistory.forEach((pt, index) => {
        const offset = targetHistory.length - 1 - index;
        processedPoints.push({
          avg_temp: pt.avg_temp ?? defaultTemp,
          avg_humidity: pt.avg_humidity ?? defaultHum,
          label: getDynamicLabel(offset)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-gray-500 sf-pro">
        <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="text-xs tracking-widest uppercase text-center px-4">
          Establishing Secure Node Data Links...
        </motion.div>
      </div>
    );
  }

  const systemStatus = mlData?.["Danger Levels"]?.Status || "YELLOW";
  const isSafe = systemStatus.toLowerCase() === "green";
  const isRainy = rainProbability >= 40 || !isSafe;
  const currentHour = currentTime.getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  const historyArray7Days = generate7DayHistory();
  const feelsLikeVal = getFeelsLike(sensorData?.avg_temp || 0, sensorData?.avg_humidity || 0);

  // Liquid glass styling variation - Changed padding from edge-to-edge
  const liquidGlassBox = "bg-white/10 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(255,255,255,0.08)] shadow-slate-950/5 hover:bg-white/15 transition-all duration-300 flex flex-col justify-between min-h-[220px]";

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
        body, main {
            font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        }
      `}} />

      <WeatherAnimation isRainy={isRainy} isNight={isNight} />
      <div className="absolute inset-0 bg-slate-950/20 mix-blend-multiply z-0 pointer-events-none"></div>

      <div className="relative z-10 p-4 sm:p-6 md:p-12">
        <header className="max-w-6xl mx-auto mb-8 md:mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-[10px] md:text-xs font-semibold tracking-widest uppercase mb-1">
              <Cpu className="w-3.5 h-3.5" /> Sri Lankan Weather Monitoring and Disaster Prediction System
            </div>
            <h1 className="text-4xl md:text-5xl tracking-widest mb-3 md:mb-4 font-lemon-milk text-white">WMNDP</h1>
            <div className="bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20 text-[10px] md:text-xs text-gray-300 inline-flex items-center gap-3 shadow-sm">
              System Status: 
              <span className={`font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${isSafe ? "text-emerald-400" : "text-amber-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${isSafe ? "bg-emerald-400" : "bg-amber-400 animate-pulse"}`} />
                {systemStatus}
              </span>
            </div>
          </div>
          <div className="w-full md:w-auto md:text-right bg-white/10 px-5 py-4 md:px-6 rounded-3xl backdrop-blur-md border border-white/20 shadow-sm">
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
          className="max-w-6xl mx-auto mb-6 bg-white/15 backdrop-blur-2xl border border-white/30 p-5 md:p-6 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 shadow-lg"
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
          
          {/* --- CARD 1: AVG TEMPERATURE --- */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} onClick={() => setShowMinMax(!showMinMax)} className={`${liquidGlassBox} p-5 md:p-6 cursor-pointer select-none group`}>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-xs md:text-sm font-medium">Avg Temperature</span>
                <Thermometer className="text-gray-300 w-4 h-4 group-hover:text-orange-300 transition-colors" />
              </div>
              <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 flex items-baseline gap-1 md:gap-2 text-white">
                {sensorData?.avg_temp?.toFixed(1) || "--"}
                <span className="text-xl md:text-2xl text-gray-500">°C</span>
              </div>
              <div className="text-[10px] md:text-xs text-gray-400 pb-1">
                <span>Feels Like: <b className="text-gray-200 font-mono font-normal">{feelsLikeVal}°C</b></span>
              </div>
              <AnimatePresence>
                {showMinMax ? (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-[10px] md:text-xs text-gray-400 flex justify-between pt-2 border-t border-white/10 mt-2 overflow-hidden">
                    <span>Min: {sensorData?.min_temp?.toFixed(1)}°C</span>
                    <span>Max: {sensorData?.max_temp?.toFixed(1)}°C</span>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] md:text-[11px] text-gray-500 flex items-center gap-1 mt-2">
                    Tap for extremities <ChevronDown className="w-3 h-3" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <MiniSparkline data={getSparklineArray("avg_temp", 28)} dataKey="avg_temp" color="#f97316" />
          </motion.div>

          {/* --- CARD 2: HUMIDITY --- */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={`${liquidGlassBox} p-5 md:p-6 group`}>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-xs md:text-sm font-medium">Humidity</span>
                <Droplets className="text-gray-300 w-4 h-4 group-hover:text-blue-300 transition-colors" />
              </div>
              <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 flex items-baseline text-white">
                {sensorData?.avg_humidity?.toFixed(1) || "--"}
                <span className="text-xl md:text-2xl text-gray-500 ml-1">%</span>
              </div>
              <div className="text-[10px] md:text-[11px] text-gray-400 bg-white/5 border border-white/10 inline-block px-2 py-0.5 rounded-md mt-1">
                Atmospheric Status: Active
              </div>
            </div>
            <MiniSparkline data={getSparklineArray("avg_humidity", 75)} dataKey="avg_humidity" color="#3b82f6" />
          </motion.div>

          {/* --- CARD 3: BAROMETRIC PRESSURE --- */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={`${liquidGlassBox} p-5 md:p-6 group`}>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400 text-xs md:text-sm font-medium">Barometric Pressure</span>
                <Gauge className="text-gray-300 w-4 h-4 group-hover:text-purple-300 transition-colors" />
              </div>
              <div className="text-2xl md:text-3xl font-light font-mono text-white mb-3">
                {sensorData?.avg_pressure?.toFixed(1) || "--"} <span className="text-xs md:text-sm text-gray-500">hPa</span>
              </div>
              <div className="border-t border-white/10 pt-2">
                <div className="text-gray-400 text-[10px] md:text-[11px] font-medium">Soil Moisture</div>
                <div className="text-lg md:text-xl font-light font-mono text-gray-300">
                  {sensorData?.median_soil || "0"}<span className="text-[10px] md:text-xs text-gray-600 ml-1">% Moisture</span>
                </div>
              </div>
            </div>
            <MiniSparkline data={getSparklineArray("avg_pressure", 1010)} dataKey="avg_pressure" color="#a855f7" />
          </motion.div>

          {/* --- CARD 4: POSSIBILITY OF RAIN --- */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${liquidGlassBox} p-5 md:p-6 group`}>
            <div className="w-full flex-1">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 text-xs md:text-sm font-medium">Possibility of Rain</span>
                <CloudRain className="text-gray-300 w-4 h-4 group-hover:text-indigo-300 transition-colors" />
              </div>
              <div className="text-4xl md:text-5xl font-extralight tracking-tighter font-mono mb-2 text-white flex items-baseline justify-between">
                <div>
                  {rainProbability}
                  <span className="text-xl md:text-2xl text-gray-500 ml-1">%</span>
                </div>
                <div className="w-[65px] bg-white/5 border border-white/10 h-1.5 rounded-full overflow-hidden self-center mr-1">
                  <div className="bg-indigo-400 h-full transition-all duration-500" style={{ width: `${rainProbability}%` }} />
                </div>
              </div>
              <div className="text-[10px] md:text-[11px] text-gray-400 bg-white/5 border border-white/10 inline-block px-2 py-0.5 rounded-md mt-1">
                Driven by historical logic nodes
              </div>
            </div>
            <MiniSparkline data={getSparklineArray("avg_humidity", 50)} dataKey="avg_humidity" color="#818cf8" />
          </motion.div>

          {/* ML Forecast */}
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="lg:col-span-4 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden p-5 md:p-8 select-none shadow-lg">
            <div className="flex items-center gap-2 text-gray-300 text-xs md:text-sm font-semibold tracking-wider uppercase mb-5 md:mb-6">
              <Clock className="w-4 h-4 text-gray-400" /> forecast for the next 4hrs
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 border-t border-white/10 pt-5 md:pt-6">
              {["Hour_01", "Hour_02", "Hour_03", "Hour_04"].map((hourKey, index) => {
                const rawString = mlData?.["Forcast"]?.[hourKey] || "Processing...";
                const cleanPrediction = rawString.split(": ")[1] || rawString;
                const actualTime = getNextHourLabel(index + 1);
                return (
                  <div key={hourKey} className="bg-white/5 border border-white/10 p-3 md:p-4 rounded-2xl text-center shadow-inner">
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

          {/* Expandable Waveform Details */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="lg:col-span-4 bg-white/10 backdrop-blur-2xl border border-white/30 rounded-3xl overflow-hidden shadow-lg"
          >
            <div 
              className="p-5 md:p-8 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors select-none"
              onClick={() => setShowGraphs(!showGraphs)}
            >
              <div className="flex items-center gap-3 text-gray-300 text-xs md:text-sm font-semibold tracking-wider uppercase">
                <div className="bg-black/20 p-2 rounded-full border border-white/10">
                  <Activity className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-400" /> 
                </div>
                trends
              </div>
              {showGraphs ? <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-gray-500" /> : <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-gray-500" />}
            </div>

            <AnimatePresence>
              {showGraphs && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-5 md:px-8 pb-5 md:pb-8">
                  
                  <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-xl border border-white/10 max-w-[240px]">
                    <button 
                      onClick={() => setTrendMode("hourly")}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${trendMode === "hourly" ? "bg-white/15 text-white shadow-sm border border-white/10" : "text-gray-400 hover:text-white"}`}
                    >
                      Hourly
                    </button>
                    <button 
                      onClick={() => setTrendMode("daily")}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-all ${trendMode === "daily" ? "bg-white/15 text-white shadow-sm border border-white/10" : "text-gray-400 hover:text-white"}`}
                    >
                      Daily
                    </button>
                  </div>

                  <div className="border-t border-white/10 pt-5 md:pt-6 grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-8">
                    
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-inner">
                      <div className="text-[9px] md:text-[10px] text-gray-400 font-bold mb-3 md:mb-4 uppercase tracking-widest flex justify-between">
                        <span>Temperature Trend</span> <span>{trendMode === "hourly" ? "Hourly View" : "Last 7 Days"}</span>
                      </div>
                      <div className="h-36 md:h-44 w-full flex items-center justify-center">
                        <LineChart data={historyArray7Days} dataKey="avg_temp" color="#f97316" unit="°C" />
                      </div>
                      <div className="flex justify-between text-[9px] md:text-[11px] text-gray-400 mt-3 md:mt-4 font-mono px-2 md:px-4">
                         {historyArray7Days.map((pt, i) => <span key={i} className="text-center w-full">{pt.label}</span>)}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col justify-between shadow-inner">
                      <div className="text-[9px] md:text-[10px] text-gray-400 font-bold mb-3 md:mb-4 uppercase tracking-widest flex justify-between">
                        <span>Humidity Trend</span> <span>{trendMode === "hourly" ? "Hourly View" : "Last 7 Days"}</span>
                      </div>
                      <div className="h-36 md:h-44 w-full flex items-center justify-center">
                        <LineChart data={historyArray7Days} dataKey="avg_humidity" color="#3b82f6" unit="%" />
                      </div>
                      <div className="flex justify-between text-[9px] md:text-[11px] text-gray-400 mt-3 md:mt-4 font-mono px-2 md:px-4">
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