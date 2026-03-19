/**
 * weeklyTempPredictor.ts — lib/predictions/weeklyTempPredictor.ts
 *
 * Fetches a 7-day AI temperature forecast from the FastAPI /predict endpoint
 * which uses the ONNX weather_model.ONE.onnx for iterative daily predictions.
 *
 *  Query params sent: humidity, wind_speed, meantemp
 *  Response:          { days: string[], temperature: number[] }
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"

export interface WeeklyForecastPoint {
  day:         string   // e.g. "Mon", "Tue", …
  temperature: number   // °C, rounded to 2 dp
}

export interface WeeklyForecastFeatures {
  humidity:   number   // %
  wind_speed: number   // km/h
  meantemp:   number   // current temperature (°C)
}

export interface WeeklyForecastResponse {
  days:        string[]
  temperature: number[]
}

// ── Local fallback (used when backend is unreachable) ────────────────────────

function localFallback(features: WeeklyForecastFeatures): WeeklyForecastPoint[] {
  const DAY_ABBRS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const todayIdx  = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 // 0=Mon

  const windEffect     = -features.wind_speed * 0.05
  const humidityEffect = -(features.humidity - 60) * 0.05

  let currentTemp = features.meantemp
  const points: WeeklyForecastPoint[] = []

  for (let i = 0; i < 7; i++) {
    const meanReversion = (28 - currentTemp) * 0.08
    const noise         = Math.sin(i * 1.1) * 0.8  // deterministic oscillation
    const nextTemp      = Math.min(55, Math.max(5, currentTemp + windEffect + humidityEffect + meanReversion + noise))
    const dayLabel      = DAY_ABBRS[(todayIdx + i) % 7]
    points.push({ day: dayLabel, temperature: Math.round(nextTemp * 100) / 100 })
    currentTemp = nextTemp
  }

  return points
}

// ── Main export ──────────────────────────────────────────────────────────────

/**
 * Fetch a 7-day AI temperature forecast.
 * Falls back to rule-based prediction if the backend is unavailable.
 */
export async function getWeeklyTempForecast(
  features: WeeklyForecastFeatures,
): Promise<WeeklyForecastPoint[]> {
  try {
    const params = new URLSearchParams({
      humidity:   String(features.humidity),
      wind_speed: String(features.wind_speed),
      meantemp:   String(features.meantemp),
    })

    const res = await fetch(`${BACKEND_URL}/predict?${params.toString()}`, {
      method:  "GET",
      headers: { "Accept": "application/json" },
      signal:  AbortSignal.timeout(5_000),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data: WeeklyForecastResponse = await res.json()

    if (!Array.isArray(data.days) || !Array.isArray(data.temperature) || data.days.length !== 7) {
      throw new Error("Invalid response shape from /predict")
    }

    return data.days.map((day, i) => ({
      day,
      temperature: data.temperature[i] ?? features.meantemp,
    }))
  } catch {
    // Graceful degradation — use local physics-based estimate
    return localFallback(features)
  }
}
