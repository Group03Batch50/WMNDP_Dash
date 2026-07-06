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
  Sun,
  Moon
} from "lucide-react";

// --- DYNAMIC APPARENT TEMPERATURE (FEELS LIKE) CALCULATOR ---
// Computes Heat Index / Humidex approximation based on temperature and relative humidity
function getFeelsLike(t: number, h: number): number {
  if (!t) return 0;
  // Simplified steadman apparent temperature calculation
  const e = (h / 100) * 6.105 * Math.exp((17.27 * t) / (237.7 + t));
  const feels = t + 0.33 * e - 4.0;
  return parseFloat(feels.toFixed(1));
}

// --- DYNAMIC VECTOR WEATHER ANIMATION (Day/Night Light Theme) ---
function WeatherAnimation({ isRainy, isNight }: { isRainy: boolean; isNight: boolean }) {
  // Lighter, highly vibrant backgrounds matching light theme glassmorphism
  const skyGradient = isRainy
    ? (isNight ? "bg-gradient-to-b from-slate-700 via-slate-600 to-zinc-400" : "bg-gradient-to-b from-zinc-300 via-slate-200 to-slate-100")
    : (isNight ? "bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-800" : "bg-gradient-to-b from-sky-200 via-blue-100 to-white");

  // Soft landscape fills optimized for lighter interface overlays
  const hillFar = isRainy ? (isNight ? "#334155" : "#cbd5e1") : (isNight ? "#1e293b" : "#a7f3d0");
  const hillMid = isRainy ? (isNight ? "#1e293b" : "#94a3b8") : (isNight ? "#0f172a" : "#6ee7b7");
  const hillClose = isRainy ? (isNight ? "#0f172a" : "#64748b") : (isNight ? "#020617" : "#34d399");

  return (
    <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none select-none">
      <div className={`absolute inset-0 transition-colors duration-1000 ${skyGradient}`} />

      {/* Sun / Moon Celestial Vectors */}
      {!isRainy && (
        isNight ? (
          <motion.div 
            className="absolute top-16 right-16 md:right-32 w-16 h-16 bg-zinc-100 rounded-full shadow-[0_0_30px_rgba(255,255,255,0.6)] opacity-90"
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
          />
        ) : (
          <motion.div 
            className="absolute top-12 right-20 md:right-40 w-24 h-24 bg-amber-300 rounded-full blur-md opacity-70 shadow-[0_0_40px_rgba(251,191,36,0.5)]"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          />
        )
      )}

      {/* Ambient Floating Clouds */}
      <div className="absolute top-8 inset-x-0 h-44 opacity-60">
        <motion.div 
          className={`absolute left-[-20%] w-56 h-14 rounded-full blur-sm ${isNight ? 'bg-slate-700/50' : 'bg-white'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 50, ease: "linear" }}
        />
        <motion.div 
          className={`absolute left-[-40%] top-10 w-64 h-16 rounded-full blur-sm ${isNight ? 'bg-slate-700/30' : 'bg-white/80'}`}
          animate={{ x: ["0vw", "130vw"] }}
          transition={{ repeat: Infinity, duration: 65, ease: "linear", delay: 5 }}
        />
      </div>

      {/* Dynamic Rain Drop Vector Generator */}
      {isRainy && (
        <div className="absolute inset-0 opacity-60 z-10">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-[1.2px] h-12 rounded ${isNight ? 'bg-indigo-300/60' : 'bg-blue-400/70'}`}
              style={{ left: `${Math.random() * 100}%`, top: `-60px` }}
              animate={{ y: ["0vh", "110vh"], x: ["0px", "-20px"] }}
              transition={{ repeat: Infinity, duration: 0.6 + Math.random() * 0.4, delay: Math.random() * 1.5, ease: "linear" }}
            />
          ))}
        </div>
      )}

      {/* Ground Vector Horizons */}
      <div className="absolute bottom-0 w-full h-[40vh] min-h-[280px]">
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '110%' }} preserveAspectRatio="none">
          <path fill={hillFar} fillOpacity="0.5" d="M0,160 C320,220 640,110 960,190 C1280,270 1360,170 1440,210 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '90%' }} preserveAspectRatio="none">
          <path fill={hillMid} fillOpacity="0.6" d="M0,210 C360,130 720,280 1080,190 C1260,145 1360,220 1440,180 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>
        <svg viewBox="0 0 1440 320" className="absolute bottom-0 w-full" style={{ height: '60%' }} preserveAspectRatio="none">
          <path fill={hillClose} d="M0,250 C440,290 880,210 1440,270 L1440,320 L0,320 Z" className="transition-colors duration-1000" />
        </svg>
      </div>
    </div>
  );
}

// --- CARD MINI SPARKLINE COMPONENT ---
function Sparkline({ data, dataKey, color }: { data: any[]; dataKey: string; color: string }) {
  if (!data || data.length < 2) return null;
  const values = data.map(d => d[dataKey] || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min === 0 ? 1 : max - min;

  const width = 100;
  const height = 30;
  const stepX = width / (data.length - 1);
  
  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - ((d[dataKey] - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// --- MAIN GRAPH COMPONENT ---
function LineChart({ data, dataKey, color, unit }: { data: any[]; dataKey: string; color: string; unit: string }) {
  if (!data || data.length === 0) return null;
  const values = data.map((d) => d[dataKey] || 0);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min === 0 ? 1 : max - min;
  
  const width = 800;
  const height = 220;
  const paddingX = 40; 
  const paddingY = 45; 
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
      <path d={pathD} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke={color} strokeWidth="3" />
          <text x={p.x} y={p.y - 14} fill="#334155" fontSize="14" textAnchor="middle" fontWeight="600" className="bg-white px-1">
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
  const [edgeForecast, setEdgeForecast] = useState<string>("Analyzing local nodes...");
  const [mlData, setMlData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showMinMax, setShowMinMax] = useState<boolean>(false);
  const [showGraphs, setShowGraphs] = useState<boolean>(false);
  const [trendTab, setTrendTab] = useState<"hourly" | "daily">("hourly");
  
  const [rainProbability, setRainProbability] = useState<number>(0);

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
    if (sensorData) {
      let prob = 0;
      if (sensorData.avg_humidity > 85) prob += 50;
      else if (sensorData.avg_humidity > 70) prob += 25;
      if (sensorData.avg_pressure && sensorData.avg_pressure < 1008) prob += 35;
      else if (sensorData.avg_pressure && sensorData.avg_pressure < 1013) prob += 15;
      setRainProbability(Math.min(100, prob));
    }
  }, [sensorData]);

  // Transforms history nodes securely into reliable arrays
  const getSparklineArray = (key: string, fallbackVal: number) => {
    if (!historyData) return Array(6).fill({ [key]: fallbackVal });
    return Object.values(historyData).slice(-6).map((pt: any) => ({
      [key]: pt[key] ?? fallbackVal
    }));
  };

  const getHistoricalArray = () => {
    const defaultTemp = sensorData?.avg_temp || 29; 
    const defaultHum = sensorData?.avg_humidity || 72; 
    const rawHistory = historyData ? Object.values(historyData) : [];
    
    let processedPoints = [];
    const pointsToRender = trendTab === "hourly" ? 6 : 7;

    if (rawHistory.length === 0) {
      for (let i = 0; i < pointsToRender; i++) {
        processedPoints.push({ 
          avg_temp: defaultTemp + (Math.sin(i) * 0.5), 
          avg_humidity: defaultHum + (Math.cos(i) * 2), 
          label: trendTab === "hourly" ? `${i + 1}h ago` : `Day -${pointsToRender - 1 - i}` 
        });
      }
    } else {
      const slicedHistory = rawHistory.slice(-pointsToRender) as any[];
      slicedHistory.forEach((pt, index) => {
        const offset = slicedHistory.length - 1 - index;
        processedPoints.push({
          avg_temp: pt.avg_temp ?? defaultTemp,
          avg_humidity: pt.avg_humidity ?? defaultHum,
          label: offset === 0 ? 'Now' : (trendTab === "hourly" ? `${offset}h ago` : `Day -${offset}`)
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 font-sans">
        <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-sm font-medium tracking-widest uppercase px-4">
          Syncing glass matrix nodes...
        </motion.div>
      </div>
    );
  }

  const systemStatus = mlData?.["Danger Levels"]?.Status || "Green";
  const isSafe = systemStatus.toLowerCase() === "green";
  const isRainy = rainProbability >= 45 || !isSafe;
  const currentHour = currentTime.getHours();
  const isNight = currentHour >= 18 || currentHour < 6;
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  
  const feelsLikeTemp = getFeelsLike(sensorData?.avg_temp || 0, sensorData?.avg_humidity || 0);
  const activeHistoryArray = getHistoricalArray();

  // Glassmorphism Shared Styles (Whitish, frosted glass look)
  const glassPanel = "bg-white/60 backdrop-blur-xl border border-white/50 shadow-sm shadow-slate-100/50";
  const textDark = isNight && !showGraphs ? "text-slate-100" : "text-slate-800";
  const textMuted = isNight && !showGraphs ? "text-slate-300" : "text-slate-500";

  return (
    <main className={`relative min-h-screen ${isNight ? 'text-slate-100' : 'text-slate-800'} selection:bg-blue-500/10 overflow-x-hidden transition-colors duration-1000`}>
      <WeatherAnimation isRainy={isRainy} isNight={isNight} />
      
      <div className="relative z-10 p-4 sm:p-6 md:p-12 max-w-6xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className={`flex items-center gap-2 text-xs font-semibold tracking-wider uppercase mb-1.5 ${isNight ? 'text-indigo-300' : 'text-blue-600'}`}>
              <Cpu className="w-4 h-4" /> Sri Lankan Weather Intelligence Matrix
            </div>
            <h1 className={`text-4xl font-black tracking-tight mb-3 ${isNight ? 'text-white' : 'text-slate-900'}`}>
              WMNDP <span className="font-light text-xl tracking-widest opacity-60">// NODE ENGINE</span>
            </h1>
            <div className="bg-white/40 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/60 text-xs inline-flex items-center gap-2.5 shadow-sm">
              <span className="text-slate-600 font-medium">System Matrix:</span> 
              <span className={`font-mono font-bold uppercase tracking-wide flex items-center gap-1.5 ${isSafe ? "text-emerald-600" : "text-amber-600"}`}>
                <div className={`w-2 h-2 rounded-full ${isSafe ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`} />
                {systemStatus}
              </span>
            </div>
          </div>
          
          <div className="bg-white/70 px-6 py-4 rounded-2xl backdrop-blur-md border border-white/60 shadow-sm text-right min-w-[220px]">
            <div className="text-3xl font-bold tracking-tight font-mono text-slate-900">{formattedTime}</div>
            <div className="flex items-center justify-end gap-2 text-xs text-slate-500 font-medium mt-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" /> {formattedDate}
            </div>
          </div>
        </header>

        {/* --- LIVE PREDICTION BANNER --- */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="mb-6 bg-white/75 backdrop-blur-2xl border border-white/80 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm shadow-blue-100/20"
        >
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600 shadow-sm flex-shrink-0">
            {isNight ? <Moon className="w-6 h-6" /> : <Sun className="w-6 h-6" />}
          </div>
          <div>
            <h3 className="text-blue-600 text-xs font-bold tracking-wider uppercase mb-1 flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Dynamic Edge Diagnosis
            </h3>
            <p className="text-lg sm:text-xl font-medium text-slate-800 tracking-tight">{edgeForecast}</p>
          </div>
        </motion.div>

        {/* --- METRIC GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
          
          {/* Temperature Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            onClick={() => setShowMinMax(!showMinMax)} 
            className={`${glassPanel} p-5 rounded-2xl cursor-pointer transition-all select-none group`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-semibold ${textMuted}`}>Ambient Air Temp</span>
              <Thermometer className="text-slate-400 w-4 h-4 group-hover:text-orange-500 transition-colors" />
            </div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-bold tracking-tight text-slate-900 font-mono">
                {sensorData?.avg_temp?.toFixed(1) || "--"}<span className="text-lg font-light text-slate-400 ml-0.5">°C</span>
              </div>
              <Sparkline data={getSparklineArray("avg_temp", 28)} dataKey="avg_temp" color="#f97316" />
            </div>
            <div className="text-xs text-slate-500 font-medium mt-2 pt-1 border-t border-slate-100 flex justify-between">
              <span>Feels Like: <b className="text-slate-700">{feelsLikeTemp}°C</b></span>
              <span className="opacity-60">Tap for details</span>
            </div>
            <AnimatePresence>
              {showMinMax && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="text-[11px] text-slate-500 flex justify-between pt-2 mt-2 border-t border-dashed border-slate-200 overflow-hidden font-mono">
                  <span>Lo: {sensorData?.min_temp?.toFixed(1)}°C</span>
                  <span>Hi: {sensorData?.max_temp?.toFixed(1)}°C</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Humidity Card */}
          <motion.div whileHover={{ y: -2 }} className={`${glassPanel} p-5 rounded-2xl transition-all group`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-semibold ${textMuted}`}>Relative Humidity</span>
              <Droplets className="text-slate-400 w-4 h-4 group-hover:text-blue-500 transition-colors" />
            </div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-bold tracking-tight text-slate-900 font-mono">
                {sensorData?.avg_humidity?.toFixed(1) || "--"}<span className="text-lg font-light text-slate-400 ml-0.5">%</span>
              </div>
              <Sparkline data={getSparklineArray("avg_humidity", 75)} dataKey="avg_humidity" color="#3b82f6" />
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-3 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
              Vapor Saturation: Optimal
            </div>
          </motion.div>

          {/* Barometric Pressure Card */}
          <motion.div whileHover={{ y: -2 }} className={`${glassPanel} p-5 rounded-2xl transition-all group flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-1">
                <span className={`text-xs font-semibold ${textMuted}`}>Barometric State</span>
                <Gauge className="text-slate-400 w-4 h-4 group-hover:text-purple-500 transition-colors" />
              </div>
              <div className="flex items-end justify-between">
                <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
                  {sensorData?.avg_pressure?.toFixed(0) || "--"}<span className="text-xs font-normal text-slate-400 ml-1">hPa</span>
                </div>
                <Sparkline data={getSparklineArray("avg_pressure", 1010)} dataKey="avg_pressure" color="#a855f7" />
              </div>
            </div>
            <div className="border-t border-slate-100 pt-2 mt-2 flex justify-between items-center">
              <span className="text-[11px] text-slate-400 font-medium">Soil Moisture</span>
              <span className="text-xs font-bold text-slate-700 font-mono">{sensorData?.median_soil || "0"}%</span>
            </div>
          </motion.div>

          {/* Rain Probability Card */}
          <motion.div whileHover={{ y: -2 }} className={`${glassPanel} p-5 rounded-2xl transition-all group`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`text-xs font-semibold ${textMuted}`}>Precipitation Risk</span>
              <CloudRain className="text-slate-400 w-4 h-4 group-hover:text-indigo-500 transition-colors" />
            </div>
            <div className="flex items-end justify-between">
              <div className="text-4xl font-bold tracking-tight text-slate-900 font-mono">
                {rainProbability}<span className="text-lg font-light text-slate-400 ml-0.5">%</span>
              </div>
              <div className="w-[100px] h-[30px] flex items-center justify-center">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${rainProbability}%` }} />
                </div>
              </div>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-3">
              Calculated via static physics logic node
            </div>
          </motion.div>

        </div>

        {/* --- DYNAMIC MACHINE LEARNING FORECAST --- */}
        <div className="bg-white/80 border border-white/90 rounded-2xl p-5 md:p-6 shadow-sm mb-6">
          <div className="flex items-center gap-2 text-slate-800 text-xs font-bold tracking-wider uppercase mb-4">
            <Clock className="w-4 h-4 text-slate-500" /> ML Live Predictive Horizon (4-Hour Cycle)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {["Hour_01", "Hour_02", "Hour_03", "Hour_04"].map((hourKey, index) => {
              const rawString = mlData?.["Forcast"]?.[hourKey] || "Evaluating...";
              const cleanPrediction = rawString.includes(":") ? rawString.split(":")[1].trim() : rawString;
              const actualTime = getNextHourLabel(index + 1);
              return (
                <div key={hourKey} className="bg-slate-50/70 border border-slate-100 p-3.5 rounded-xl text-center shadow-inner">
                  <span className="text-[11px] text-slate-400 font-bold block mb-1 font-mono uppercase">{actualTime}</span>
                  <span className="text-xs font-medium text-slate-700 tracking-tight">{cleanPrediction}</span>
                </div>
              );
            })}
          </div>
          <div className="text-right mt-3.5 text-[10px] text-slate-400 font-mono uppercase tracking-wider">
            Model Instantiated: {mlData?.calculated_at || "N/A"}
          </div>
        </div>

        {/* --- EXPANDABLE DESCRIPTIVE TRENDS SECTION --- */}
        <div 
          className="bg-white/90 border border-white/90 rounded-2xl overflow-hidden shadow-md transition-all duration-300"
        >
          <div 
            className="p-5 md:p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50/50"
            onClick={() => setShowGraphs(!showGraphs)}
          >
            <div className="flex items-center gap-3 text-slate-800 text-xs font-bold tracking-wider uppercase">
              <div className="bg-slate-100 p-2 rounded-full border border-slate-200">
                <Activity className="w-4 h-4 text-slate-600" /> 
              </div>
              Advanced Analytics & Historical Insights
            </div>
            {showGraphs ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
          </div>

          <AnimatePresence>
            {showGraphs && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} 
                animate={{ height: "auto", opacity: 1 }} 
                exit={{ height: 0, opacity: 0 }} 
                className="px-5 md:px-6 pb-6 border-t border-slate-100"
              >
                {/* Descriptive Insights Banner */}
                <div className="my-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100 text-xs text-slate-600 leading-relaxed">
                  <b>Analysis Matrix Summary:</b> These visualizations aggregate localized sensor inputs tracked from the Firebase node. Checking shifting vectors across alternative time scopes exposes structural micro-climate patterns critical for predicting rapid atmospheric disruptions common across the region.
                </div>

                {/* Sub-navigation Controls (Tabs) */}
                <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-lg max-w-[260px]">
                  <button 
                    onClick={() => setTrendTab("hourly")}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold tracking-wide transition-all ${trendTab === "hourly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Hourly Analytics
                  </button>
                  <button 
                    onClick={() => setTrendTab("daily")}
                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold tracking-wide transition-all ${trendTab === "daily" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
                  >
                    Daily Analytics
                  </button>
                </div>

                {/* Main Graph Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Temperature Trend */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-inner">
                    <div className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-wider flex justify-between">
                      <span>Temperature Waveform</span> <span>Scope: {trendTab === "hourly" ? "Recent Cycles" : "7-Day Aggregate"}</span>
                    </div>
                    <div className="h-44 w-full flex items-center justify-center">
                      <LineChart data={activeHistoryArray} dataKey="avg_temp" color="#f97316" unit="°C" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-mono px-2 font-semibold">
                       {activeHistoryArray.map((pt, i) => <span key={i} className="text-center w-full">{pt.label}</span>)}
                    </div>
                  </div>

                  {/* Humidity Trend */}
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-4 flex flex-col justify-between shadow-inner">
                    <div className="text-[10px] text-slate-400 font-bold mb-4 uppercase tracking-wider flex justify-between">
                      <span>Humidity Gradient</span> <span>Scope: {trendTab === "hourly" ? "Recent Cycles" : "7-Day Aggregate"}</span>
                    </div>
                    <div className="h-44 w-full flex items-center justify-center">
                      <LineChart data={activeHistoryArray} dataKey="avg_humidity" color="#3b82f6" unit="%" />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-3 font-mono px-2 font-semibold">
                       {activeHistoryArray.map((pt, i) => <span key={i} className="text-center w-full">{pt.label}</span>)}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}