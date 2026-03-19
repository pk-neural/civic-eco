/**
 * AQI Hourly Predictor — lib/predictions/aqiPredictor.ts
 * Calls FastAPI POST /predict/aqi-hourly for 72-hour forecast.
 * Falls back to a rule-based local estimate if the backend is unavailable.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export interface HourlyAQIPoint {
  hour: number        // 0 = current hour, 1 = +1h, ... 72 = +72h
  label: string       // e.g. "Now", "+1h", "+24h"
  aqi: number
  category: string
  color: string       // hex color for AQI category
  isPredicted: boolean
}

export interface WeatherFeatures {
  temperature: number
  humidity: number
  wind_speed: number
  pressure?: number
  pm25: number
  pm10: number
  co: number
  no2: number
  so2: number
  o3: number
}

function aqiToMeta(aqi: number): { category: string; color: string } {
  if (aqi <= 50)  return { category: "Good",       color: "#22c55e" }
  if (aqi <= 100) return { category: "Satisfactory",color: "#84cc16" }
  if (aqi <= 200) return { category: "Moderate",   color: "#f59e0b" }
  if (aqi <= 300) return { category: "Poor",        color: "#f97316" }
  if (aqi <= 400) return { category: "Very Poor",   color: "#ef4444" }
  return           { category: "Severe",            color: "#7c3aed" }
}

function hourLabel(h: number): string {
  if (h === 0) return "Now"
  if (h % 24 === 0) return `Day ${h / 24}`
  return `+${h}h`
}

/** Local fallback — simple trend model */
function localFallback(features: WeatherFeatures, hours: number): HourlyAQIPoint[] {
  const { pm25, wind_speed } = features
  const points: HourlyAQIPoint[] = []
  // AQI from pm25 (CPCB breakpoints, simplified)
  function pm25ToAqi(pm: number) {
    if (pm <= 30)  return (pm * 50) / 30
    if (pm <= 60)  return 51 + ((pm - 31) * 49) / 29
    if (pm <= 90)  return 101 + ((pm - 61) * 99) / 29
    if (pm <= 120) return 201 + ((pm - 91) * 99) / 29
    if (pm <= 250) return 301 + ((pm - 121) * 99) / 129
    return          401 + ((pm - 251) * 99) / 249
  }
  const baseAqi = Math.round(Math.min(500, Math.max(0, pm25ToAqi(pm25))))
  for (let h = 0; h <= hours; h++) {
    const windEffect = -wind_speed * 0.02 * h
    const diurnalEffect = Math.sin((h % 24) * (Math.PI / 12)) * 15
    const aqi = Math.round(Math.min(500, Math.max(0, baseAqi + windEffect + diurnalEffect)))
    const { category, color } = aqiToMeta(aqi)
    points.push({ hour: h, label: hourLabel(h), aqi, category, color, isPredicted: h > 0 })
  }
  return points
}

export async function getAQIHourlyForecast(
  features: WeatherFeatures,
  hours = 72,
): Promise<HourlyAQIPoint[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/predict/aqi-hourly`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: features.temperature,
        humidity:    features.humidity,
        wind_speed:  features.wind_speed,
        pressure:    features.pressure ?? 1013,
        pm25:        features.pm25,
        pm10:        features.pm10,
        co:          features.co,
        no2:         features.no2,
        so2:         features.so2,
        o3:          features.o3,
      }),
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: { hour: number; aqi: number }[] = await res.json()

    return data.slice(0, hours + 1).map((pt) => {
      const { category, color } = aqiToMeta(pt.aqi)
      return { hour: pt.hour, label: hourLabel(pt.hour), aqi: pt.aqi, category, color, isPredicted: pt.hour > 0 }
    })
  } catch {
    // Backend unavailable — use local model
    return localFallback(features, hours)
  }
}
