/**
 * Temperature Hourly Predictor — lib/predictions/temperaturePredictor.ts
 * Calls FastAPI POST /predict/temp-hourly for 72-hour temperature forecast.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export interface HourlyTempPoint {
  hour: number
  label: string
  temperature: number   // °C
  isPredicted: boolean
}

export interface TempFeatures {
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

function hourLabel(h: number): string {
  if (h === 0) return "Now"
  if (h % 24 === 0) return `Day ${h / 24}`
  return `+${h}h`
}

function localFallback(features: TempFeatures, hours: number): HourlyTempPoint[] {
  const points: HourlyTempPoint[] = []
  const base = features.temperature
  for (let h = 0; h <= hours; h++) {
    // Diurnal cycle: peak at 2 PM, trough at 4 AM
    const hourOfDay = (new Date().getHours() + h) % 24
    const diurnal = -5 * Math.cos(((hourOfDay - 14) * 2 * Math.PI) / 24)
    const drift = h < 24 ? 0 : (h / 24 - 1) * -0.3 // slight cooling over days
    const temp = Math.round((base + diurnal + drift) * 10) / 10
    points.push({ hour: h, label: hourLabel(h), temperature: temp, isPredicted: h > 0 })
  }
  return points
}

export async function getTempHourlyForecast(
  features: TempFeatures,
  hours = 72,
): Promise<HourlyTempPoint[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/predict/temp-hourly`, {
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
    const data: { hour: number; temperature: number }[] = await res.json()

    return data.slice(0, hours + 1).map((pt) => ({
      hour:        pt.hour,
      label:       hourLabel(pt.hour),
      temperature: pt.temperature,
      isPredicted: pt.hour > 0,
    }))
  } catch {
    return localFallback(features, hours)
  }
}
