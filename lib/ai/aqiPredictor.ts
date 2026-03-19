import type { AQIForecast } from "@/lib/types"
import type { WeatherData } from "@/lib/types"

/**
 * Predicts AQI for the next 24, 48, and 72 hours.
 * Calls the Next.js proxy route which forwards to the FastAPI backend.
 *
 * @param weather  Current weather + AQI data from getWeatherData()
 * @param pm25     PM2.5 reading (μg/m³)
 * @param pm10     PM10 reading (μg/m³)
 * @param co       CO reading (μg/m³)
 * @param no2      NO₂ reading (μg/m³)
 * @param so2      SO₂ reading (μg/m³)
 * @param o3       Ozone reading (μg/m³)
 */
export async function predictAQI(
  weather: WeatherData,
  pm25 = 60,
  pm10 = 100,
  co = 0.5,
  no2 = 30,
  so2 = 10,
  o3 = 40
): Promise<AQIForecast | null> {
  try {
    const response = await fetch("/api/predict-aqi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        temperature: weather.temperature,
        humidity: weather.humidity,
        wind_speed: weather.windSpeed,
        pm25,
        pm10,
        co,
        no2,
        so2,
        o3,
      }),
    })

    if (!response.ok) {
      console.error("AQI prediction failed:", response.statusText)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("AQI predictor error:", err)
    return null
  }
}

/** Maps AQI values to color and label pairs for display. */
export function aqiToDisplay(aqi: number): { label: string; color: string; bg: string } {
  if (aqi <= 50)  return { label: "Good",         color: "text-green-400",  bg: "bg-green-500/20" }
  if (aqi <= 100) return { label: "Satisfactory", color: "text-lime-400",   bg: "bg-lime-500/20" }
  if (aqi <= 200) return { label: "Moderate",     color: "text-amber-400",  bg: "bg-amber-500/20" }
  if (aqi <= 300) return { label: "Poor",         color: "text-orange-400", bg: "bg-orange-500/20" }
  if (aqi <= 400) return { label: "Very Poor",    color: "text-red-400",    bg: "bg-red-500/20" }
  return             { label: "Severe",         color: "text-purple-400", bg: "bg-purple-500/20" }
}
