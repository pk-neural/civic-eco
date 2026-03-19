"use client"

import { useEffect, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"
import { Brain, TrendingUp, AlertTriangle, Wind } from "lucide-react"
import type { AQIForecast } from "@/lib/types"
import { aqiToDisplay } from "@/lib/ai/aqiPredictor"

interface AQIForecastChartProps {
  forecast: AQIForecast
  compact?: boolean
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const point = payload[0].payload
    const { label, color } = aqiToDisplay(point.aqi)
    return (
      <div className="bg-slate-900/90 border border-white/20 rounded-lg px-3 py-2 text-sm shadow-xl">
        <p className="text-muted-foreground mb-1">{point.label}</p>
        <p className={`font-bold text-lg ${color}`}>{point.aqi}</p>
        <p className={`text-xs ${color}`}>{label}</p>
      </div>
    )
  }
  return null
}

export function AQIForecastChart({ forecast, compact = false }: AQIForecastChartProps) {
  const chartData = [
    { label: "Now", aqi: forecast.current_aqi, hours: 0 },
    ...forecast.forecast.map((f) => ({
      label: `+${f.hours}h`,
      aqi: f.aqi,
      hours: f.hours,
    })),
  ]

  const maxAQI   = Math.max(...chartData.map((d) => d.aqi), 100)
  const trend    = forecast.forecast[0].aqi - forecast.current_aqi
  const { label: curLabel, color: curColor } = aqiToDisplay(forecast.current_aqi)

  return (
    <div className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-xl ${compact ? "p-4" : "p-6"} overflow-hidden`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Brain className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-foreground">AI AQI Forecast</h3>
          </div>
          <p className="text-xs text-muted-foreground">Machine learning prediction · 24–72h</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground mb-0.5">Current</p>
          <p className={`text-2xl font-bold ${curColor}`}>{forecast.current_aqi}</p>
          <p className={`text-xs ${curColor}`}>{curLabel}</p>
        </div>
      </div>

      {/* Forecast Pills */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {forecast.forecast.map((f) => {
          const { label, color, bg } = aqiToDisplay(f.aqi)
          return (
            <div key={f.hours} className={`rounded-lg p-2 text-center ${bg} border border-white/10`}>
              <p className="text-xs text-muted-foreground">+{f.hours}h</p>
              <p className={`text-lg font-bold ${color}`}>{f.aqi}</p>
              <p className={`text-xs ${color}`}>{label}</p>
            </div>
          )
        })}
      </div>

      {/* Chart */}
      {!compact && (
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 11 }} />
              <YAxis domain={[0, Math.ceil(maxAQI / 50) * 50]} tick={{ fill: "#6b7280", fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              {/* AQI threshold lines */}
              <ReferenceLine y={100} stroke="#84cc16" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={200} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.5} />
              <ReferenceLine y={300} stroke="#f97316" strokeDasharray="4 4" strokeOpacity={0.5} />
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="url(#aqiGradient)"
                strokeWidth={2.5}
                dot={{ fill: "#a855f7", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: "#a855f7" }}
              />
              <defs>
                <linearGradient id="aqiGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trend indicator */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
        {trend > 20 ? (
          <AlertTriangle className="h-4 w-4 text-orange-400 shrink-0" />
        ) : trend < -20 ? (
          <Wind className="h-4 w-4 text-emerald-400 shrink-0" />
        ) : (
          <TrendingUp className="h-4 w-4 text-blue-400 shrink-0" />
        )}
        <p className="text-xs text-muted-foreground">
          {trend > 20
            ? `AQI expected to rise by ~${trend} points in 24h — limit outdoor activity.`
            : trend < -20
            ? `AQI trending lower by ~${Math.abs(trend)} points — conditions improving.`
            : "AQI relatively stable over the next 24 hours."}
        </p>
      </div>
    </div>
  )
}
