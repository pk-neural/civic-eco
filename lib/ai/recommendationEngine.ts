import type { Recommendation, WeatherData, DailyInput } from "@/lib/types"

interface RecommendationContext {
  weather: WeatherData
  dailyInput?: DailyInput | null
}

/**
 * Fetches personalized environmental recommendations from the backend.
 * Combines live weather/AQI data with the user's daily behavior patterns.
 */
export async function getRecommendations(ctx: RecommendationContext): Promise<Recommendation[]> {
  const { weather, dailyInput } = ctx

  try {
    const response = await fetch("/api/recommendations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aqi:        weather.aqi,
        temperature: weather.temperature,
        humidity:    weather.humidity,
        wind_speed:  weather.windSpeed,
        condition:   weather.condition,
        ac_fan_hours:      dailyInput?.acFanHours ?? null,
        water_usage:       dailyInput?.waterUsage ?? null,
        transport_mode:    dailyInput?.transportMode ?? null,
        waste_segregation: dailyInput?.wasteSegregation ?? null,
      }),
    })

    if (!response.ok) {
      console.error("Recommendations fetch failed:", response.statusText)
      return getFallbackRecommendations(weather)
    }

    const data = await response.json()
    return data.recommendations as Recommendation[]
  } catch (err) {
    console.error("Recommendation engine error:", err)
    return getFallbackRecommendations(weather)
  }
}

/** Priority-based sort order for displaying recommendations. */
export function sortRecommendations(recs: Recommendation[]): Recommendation[] {
  const order = { high: 0, medium: 1, low: 2 }
  return [...recs].sort((a, b) => order[a.priority] - order[b.priority])
}

/** UI helper — returns color classes for a recommendation priority. */
export function priorityToStyle(priority: string): { dot: string; border: string } {
  switch (priority) {
    case "high":   return { dot: "bg-red-400",    border: "border-red-500/20" }
    case "medium": return { dot: "bg-amber-400",  border: "border-amber-500/20" }
    default:       return { dot: "bg-emerald-400", border: "border-emerald-500/20" }
  }
}

function getFallbackRecommendations(weather: WeatherData): Recommendation[] {
  const recs: Recommendation[] = []

  if (weather.aqi > 200) {
    recs.push({
      icon: "🏠", title: "Stay Indoors Today",
      description: "AQI levels are Poor or worse. Limit outdoor exposure and keep windows shut.",
      priority: "high", category: "air",
    })
  } else {
    recs.push({
      icon: "🌿", title: "Air Quality is Manageable",
      description: "Current AQI allows for short outdoor activities. Avoid peak traffic hours.",
      priority: "low", category: "air",
    })
  }

  if (weather.temperature > 35) {
    recs.push({
      icon: "💧", title: "Drink Plenty of Water",
      description: "High temperatures require increased hydration — aim for 3+ liters today.",
      priority: "high", category: "water",
    })
  }

  recs.push({
    icon: "🚌", title: "Use Public Transport",
    description: "Switching from a private vehicle saves up to 70% in personal CO₂ emissions.",
    priority: "medium", category: "transport",
  })

  return recs
}
