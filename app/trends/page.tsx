"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, TrendingUp, Thermometer, Wind, CloudRain, AlertTriangle,
  Clock, Brain, CheckCircle, Cpu,
} from "lucide-react"
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, BarChart, Bar, Cell,
} from "recharts"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { getUser } from "@/lib/storage"
import { getWeatherData, getForecast } from "@/lib/api"
import { getAQIHourlyForecast  } from "@/lib/predictions/aqiPredictor"
import { getTempHourlyForecast } from "@/lib/predictions/temperaturePredictor"
import { getRainHourlyForecast } from "@/lib/predictions/rainPredictor"
import { getWeeklyTempForecast, type WeeklyForecastPoint } from "@/lib/predictions/weeklyTempPredictor"
import type { User, WeatherData } from "@/lib/types"

type Tab = "past24" | "next72"

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(2,6,23,0.92)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    color: "#e2e8f0",
    fontSize: 12,
  },
}

/* bar gradient colours for the 7-day chart — warm orange → amber spectrum */
const BAR_GRADIENT_COLOURS = [
  "#f97316", "#fb923c", "#fbbf24", "#f59e0b", "#f97316", "#fb923c", "#fbbf24",
]

/* ─── small helper: sample every Nth point to keep charts legible ─── */
function sample<T>(arr: T[], every = 3): T[] {
  return arr.filter((_, i) => i % every === 0)
}

export default function TrendsPage() {
  const router = useRouter()
  const [user, setUser]             = useState<User | null>(null)
  const [weather, setWeather]       = useState<WeatherData | null>(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<Tab>("next72")

  // Hourly prediction data
  const [aqiData,  setAqiData]  = useState<any[]>([])
  const [tempData, setTempData] = useState<any[]>([])
  const [rainData, setRainData] = useState<any[]>([])

  // 7-day ONNX weekly forecast
  const [weeklyForecast,        setWeeklyForecast]        = useState<WeeklyForecastPoint[]>([])
  const [weeklyForecastLoading, setWeeklyForecastLoading] = useState(false)
  const [weeklyForecastError,   setWeeklyForecastError]   = useState(false)

  // Past 24 h (daily fallback)
  const [pastData, setPastData] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      const currentUser = await getUser()
      if (!currentUser) { router.push("/"); return }
      setUser(currentUser)

      const w = await getWeatherData(currentUser.lat, currentUser.lon)
      setWeather(w)

      // Build features for ML predictor
      const features = {
        temperature: w.temperature,
        humidity:    w.humidity,
        wind_speed:  w.windSpeed,
        pm25:        Math.round(w.aqi * 0.4),   // approximate from AQI
        pm10:        Math.round(w.aqi * 0.6),
        co:          0.8,
        no2:         30,
        so2:         15,
        o3:          40,
      }

      // Fetch all 3 hourly forecasts + 7-day ONNX forecast in parallel
      setWeeklyForecastLoading(true)
      setWeeklyForecastError(false)

      const [aqiPoints, tempPoints, rainPoints, weeklyData] = await Promise.all([
        getAQIHourlyForecast(features, 72),
        getTempHourlyForecast(features, 72),
        getRainHourlyForecast(features, 72),
        getWeeklyTempForecast({
          humidity:   w.humidity,
          wind_speed: w.windSpeed,
          meantemp:   w.temperature,
        }).catch(() => {
          setWeeklyForecastError(true)
          return [] as WeeklyForecastPoint[]
        }),
      ])

      setWeeklyForecastLoading(false)
      setWeeklyForecast(weeklyData)

      // Combined hourly data
      const combined = aqiPoints.map((pt, i) => ({
        label:       pt.label,
        hour:        pt.hour,
        aqi:         pt.isPredicted ? pt.aqi : undefined,
        aqiSolid:    !pt.isPredicted ? pt.aqi : undefined,
        temperature: tempPoints[i]?.temperature ?? w.temperature,
        rainfall:    rainPoints[i]?.rainfall ?? 0,
        isPredicted: pt.isPredicted,
      }))

      setAqiData(sample(combined, 3))
      setTempData(sample(combined, 3))
      setRainData(sample(combined, 3))

      // Past 24h — use 7-day forecast as proxy and take first day + today
      const forecast = await getForecast(currentUser.lat, currentUser.lon)
      const past = forecast.slice(0, 3).map((d, i) => ({
        label:       i === 0 ? "3 days ago" : i === 1 ? "Yesterday" : "Today",
        temperature: (d.tempMax + d.tempMin) / 2,
        aqi:         d.aqi,
        rainfall:    d.rainProbability,
      }))
      setPastData(past)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading || !user || !weather) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const avgFutureAQI  = aqiData.length  ? Math.round(aqiData.reduce((a, b)  => a + (b.aqi ?? b.aqiSolid ?? 0), 0) / aqiData.length)  : 0
  const avgFutureTemp = tempData.length ? Math.round(tempData.reduce((a, b) => a + b.temperature, 0) / tempData.length) : 0
  const maxRain       = rainData.length ? Math.max(...rainData.map((d) => d.rainfall)) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Environmental Trends</h1>
          </div>
          <p className="text-muted-foreground">
            AI-powered hourly forecasts for {user.city}, {user.state}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-6 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
          {([
            { id: "past24" as Tab, label: "Past 24 Hours", icon: Clock },
            { id: "next72" as Tab, label: "Next 72 Hours", icon: Brain },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === id
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === "next72" && (
          <>
            {/* Summary Cards */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              {[
                { label: "Avg Predicted AQI", value: String(avgFutureAQI), sub: avgFutureAQI <= 100 ? "Good–Satisfactory" : avgFutureAQI <= 200 ? "Moderate" : "Poor", icon: Wind, color: "emerald" },
                { label: "Avg Temperature",   value: `${avgFutureTemp}°C`, sub: avgFutureTemp > 35 ? "Hot conditions" : "Comfortable",  icon: Thermometer, color: "orange" },
                { label: "Max Rain Chance",   value: `${maxRain}%`,        sub: maxRain > 60 ? "Heavy rain expected" : maxRain > 30 ? "Possible showers" : "Low rain risk", icon: CloudRain, color: "blue" },
              ].map(({ label, value, sub, icon: Icon, color }) => (
                <div key={label} className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                  <div className={`p-2 bg-${color}-500/20 rounded-lg w-fit mb-3`}>
                    <Icon className={`h-4 w-4 text-${color}-400`} />
                  </div>
                  <p className="text-muted-foreground text-xs">{label}</p>
                  <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
                  <p className={`text-xs text-${color}-400 mt-0.5`}>{sub}</p>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-emerald-400 inline-block" />
                Solid = current data
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-6 border-t-2 border-dashed border-violet-400 inline-block" />
                Dashed = AI predicted
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-3 w-3 text-emerald-400" />
                ML model (RandomForest) + fallback
              </span>
              <span className="flex items-center gap-1.5">
                <Cpu className="h-3 w-3 text-orange-400" />
                ONNX model (7-day)
              </span>
            </div>

            {/* ── 7-Day ONNX Temperature Forecast ── */}
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Cpu className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">7-Day AI Temperature Forecast</h2>
                    <p className="text-xs text-muted-foreground">
                      ONNX model · iterative daily prediction from live weather data
                    </p>
                  </div>
                </div>
                {/* Model source badge */}
                <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-orange-500/10 border border-orange-500/30 text-orange-400">
                  <Cpu className="h-3 w-3" />
                  weather_model.ONE.onnx
                </span>
              </div>

              {weeklyForecastLoading ? (
                /* Loading skeleton */
                <div className="h-56 flex items-end gap-3 px-4">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-lg bg-orange-500/10 animate-pulse"
                      style={{ height: `${40 + Math.sin(i) * 20}%` }}
                    />
                  ))}
                </div>
              ) : weeklyForecastError || weeklyForecast.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                  <AlertTriangle className="h-6 w-6 text-amber-400" />
                  <p className="text-sm">Could not load weekly forecast — backend may be offline.</p>
                  <p className="text-xs">Start FastAPI: <code className="text-orange-400">uvicorn main:app --reload</code></p>
                </div>
              ) : (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyForecast} barCategoryGap="20%" barGap={4}>
                      <defs>
                        <linearGradient id="onnxBarGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"  stopColor="#f97316" stopOpacity={0.9} />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.4)"
                        fontSize={11}
                        unit="°"
                        domain={([min, max]: [number, number]) => [
                          Math.floor(min - 2),
                          Math.ceil(max + 2),
                        ]}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        {...TOOLTIP_STYLE}
                        formatter={(v: number) => [`${v}°C`, "Predicted Temp"]}
                        cursor={{ fill: "rgba(255,255,255,0.05)", radius: 6 }}
                      />
                      <Bar
                        dataKey="temperature"
                        fill="url(#onnxBarGrad)"
                        radius={[6, 6, 0, 0]}
                        name="Temperature"
                        maxBarSize={48}
                        label={{
                          position: "top",
                          fill: "rgba(255,255,255,0.6)",
                          fontSize: 11,
                          formatter: (v: number) => `${v}°`,
                        }}
                      >
                        {weeklyForecast.map((_, idx) => (
                          <Cell key={idx} fill={BAR_GRADIENT_COLOURS[idx % BAR_GRADIENT_COLOURS.length]} fillOpacity={0.85} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Mini stats row */}
              {!weeklyForecastLoading && weeklyForecast.length === 7 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  {weeklyForecast.map(({ day, temperature }) => (
                    <div key={day} className="flex flex-col items-center gap-0.5">
                      <span className="text-xs text-muted-foreground">{day}</span>
                      <span className="text-sm font-semibold text-orange-400">{temperature}°</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AQI Chart */}
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Wind className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">AQI Trend — 72 Hours</h2>
                  <p className="text-xs text-muted-foreground">Predicted Air Quality Index (dashed = AI forecast)</p>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={aqiData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                    <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} interval={3} />
                    <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} domain={[0, 300]} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="aqiSolid"  stroke="#10b981" strokeWidth={2.5} dot={false} name="Current AQI"   connectNulls />
                    <Line type="monotone" dataKey="aqi"       stroke="#a78bfa" strokeWidth={2} strokeDasharray="5 4" dot={false} name="Predicted AQI" connectNulls />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature + Rain, side by side */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">
              {/* Temperature Area Chart */}
              <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Thermometer className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Temperature Forecast</h2>
                    <p className="text-xs text-muted-foreground">72-hour hourly temperature (°C)</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tempData}>
                      <defs>
                        <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} interval={4} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} unit="°" />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}°C`, "Temp"]} />
                      <Area
                        type="monotone"
                        dataKey="temperature"
                        stroke="#f97316"
                        fill="url(#tempGrad)"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={false}
                        name="Temperature"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Rainfall Area Chart */}
              <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <CloudRain className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Rainfall Forecast</h2>
                    <p className="text-xs text-muted-foreground">72-hour precipitation probability (%)</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={rainData}>
                      <defs>
                        <linearGradient id="rainGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                      <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={11} interval={4} />
                      <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} unit="%" domain={[0, 100]} />
                      <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v}%`, "Rain chance"]} />
                      <Area
                        type="monotone"
                        dataKey="rainfall"
                        stroke="#3b82f6"
                        fill="url(#rainGrad)"
                        strokeWidth={2}
                        strokeDasharray="5 3"
                        dot={false}
                        name="Rain %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === "past24" && (
          <>
            {pastData.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-amber-400" />
                <p>Historical data unavailable. Try the Next 72 Hours tab.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <Clock className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Past Environmental Data</h2>
                      <p className="text-xs text-muted-foreground">Recent days for {user.city}</p>
                    </div>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
                        <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                        <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="aqi"         stroke="#10b981" strokeWidth={2.5} dot={{ fill: "#10b981" }} name="AQI" />
                        <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={{ fill: "#f97316" }} name="Temp (°C)" />
                        <Line type="monotone" dataKey="rainfall"    stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} name="Rain %" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Water Conservation Tips */}
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4">💡 Water Conservation Tips</h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { title: "Shorter Showers", body: "Reduce shower time by 2 minutes to save 20L daily" },
                      { title: "Fix Leaks",       body: "A dripping tap wastes 15L per day" },
                      { title: "Rainwater",       body: "Collect rooftop rainwater for garden/toilet use" },
                      { title: "Smart Appliances",body: "Use water-efficient washing machines and dishwashers" },
                    ].map(({ title, body }) => (
                      <div key={title} className="p-3 bg-white/5 rounded-lg">
                        <p className="text-sm font-medium text-foreground">{title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
