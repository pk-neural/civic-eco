import type { AIEcoScore, DailyInput } from "@/lib/types"

/**
 * Predicts the user's AI Eco-Impact Score from their daily lifestyle inputs.
 * Returns a score (0–100), category, insights, and a breakdown by factor.
 */
export async function predictEcoScore(input: DailyInput): Promise<AIEcoScore | null> {
  try {
    const response = await fetch("/api/predict-eco", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ac_fan_hours:     input.acFanHours,
        water_usage:      input.waterUsage,
        transport_mode:   input.transportMode,
        outdoor_exposure: input.outdoorExposure,
        waste_segregation: input.wasteSegregation,
      }),
    })

    if (!response.ok) {
      console.error("Eco score prediction failed:", response.statusText)
      return null
    }

    return await response.json()
  } catch (err) {
    console.error("Eco score model error:", err)
    return null
  }
}

/** Returns the Tailwind color class and label for a given score. */
export function ecoScoreToStyle(category: string): {
  gradient: string
  border: string
  badge: string
  badgeBg: string
} {
  switch (category) {
    case "Eco-Friendly":
      return {
        gradient: "from-emerald-500 to-teal-400",
        border:   "border-emerald-500/30",
        badge:    "text-emerald-400",
        badgeBg:  "bg-emerald-500/20",
      }
    case "Moderate":
      return {
        gradient: "from-amber-500 to-yellow-400",
        border:   "border-amber-500/30",
        badge:    "text-amber-400",
        badgeBg:  "bg-amber-500/20",
      }
    default: // High Impact
      return {
        gradient: "from-red-500 to-orange-400",
        border:   "border-red-500/30",
        badge:    "text-red-400",
        badgeBg:  "bg-red-500/20",
      }
  }
}
