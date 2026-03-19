"use client"

import { Thermometer, Droplets, Wind, Sun, CloudSun } from "lucide-react"
import type { WeatherData } from "@/lib/types"
import { AnimatedCounter } from "./animated-counter"

interface WeatherCardProps {
  weather: WeatherData
  city: string
}

export function WeatherCard({ weather, city }: WeatherCardProps) {
  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-emerald-400" // Good
    if (aqi <= 100) return "text-green-400" // Satisfactory
    if (aqi <= 200) return "text-amber-400" // Moderate
    if (aqi <= 300) return "text-orange-400" // Poor
    if (aqi <= 400) return "text-red-400" // Very Poor
    return "text-red-600" // Severe
  }

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Satisfactory"
    if (aqi <= 200) return "Moderate"
    if (aqi <= 300) return "Poor"
    if (aqi <= 400) return "Very Poor"
    return "Severe"
  }

  return (
    <div className="relative bg-gradient-to-br from-teal-500/20 via-emerald-500/10 to-cyan-500/20 border border-teal-500/30 rounded-xl p-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-2xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{city}</h3>
            <p className="text-sm text-muted-foreground">Real-time Weather</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-foreground">
              <AnimatedCounter value={weather.temperature} suffix="°C" />
            </p>
            <p className="text-sm text-muted-foreground flex items-center justify-end gap-1">
              <CloudSun className="h-4 w-4" />
              {weather.condition}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Droplets className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Humidity</p>
              <p className="text-sm font-semibold text-foreground">{weather.humidity}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Wind className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Wind</p>
              <p className="text-sm font-semibold text-foreground">{weather.windSpeed} km/h</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Sun className="h-4 w-4 text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">UV Index</p>
              <p className="text-sm font-semibold text-foreground">{weather.uvIndex}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Thermometer className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">AQI (India)</p>
              <p className={`text-sm font-semibold ${getAQIColor(weather.aqi)}`}>
                {weather.aqi} - {getAQILabel(weather.aqi)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
