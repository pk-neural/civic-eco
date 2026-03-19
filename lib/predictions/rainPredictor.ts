/**
 * Rain Hourly Predictor — lib/predictions/rainPredictor.ts
 * Calls FastAPI POST /predict/rain-hourly for 72-hour rainfall probability forecast.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export interface HourlyRainPoint {
  hour: number
  label: string
  rainfall: number    // mm precipitation probability (0-100)
  isPredicted: boolean
}

export interface RainFeatures {
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

function localFallback(features: RainFeatures, hours: number): HourlyRainPoint[] {
  const points: HourlyRainPoint[] = []
  // Higher humidity → higher rain probability
  const baseProbability = Math.min(100, Math.max(0, (features.humidity - 40) * 1.5))
  for (let h = 0; h <= hours; h++) {
    // Afternoon peak for rain
    const hourOfDay = (new Date().getHours() + h) % 24
    const afternoonBoost = hourOfDay >= 14 && hourOfDay <= 18 ? 15 : 0
    const noise = (Math.sin(h * 0.7) * 8)
    const probability = Math.round(Math.min(100, Math.max(0, baseProbability + afternoonBoost + noise)))
    points.push({ hour: h, label: hourLabel(h), rainfall: probability, isPredicted: h > 0 })
  }
  return points
}

export async function getRainHourlyForecast(
  features: RainFeatures,
  hours = 72,
): Promise<HourlyRainPoint[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/predict/rain-hourly`, {
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
    const data: { hour: number; rainfall: number }[] = await res.json()

    return data.slice(0, hours + 1).map((pt) => ({
      hour:        pt.hour,
      label:       hourLabel(pt.hour),
      rainfall:    pt.rainfall,
      isPredicted: pt.hour > 0,
    }))
  } catch {
    return localFallback(features, hours)
  }
}
