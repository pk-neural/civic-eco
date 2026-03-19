/**
 * Carbon Calculator — lib/predictions/carbonCalculator.ts
 * Pure calculation functions for daily carbon footprint from user activities.
 */

// Emission factors (kg CO₂ per unit)
export const EMISSION_FACTORS = {
  carKm:        0.21,   // per km
  busKm:        0.05,   // per km
  bikeKm:       0.0,    // per km (zero emission)
  walkKm:       0.0,    // per km (zero emission)
  acHour:       1.5,    // per hour
  electricityKwh: 0.82, // per kWh (India grid average)
  waterLiters:  0.0005, // per 100L → 0.05 kg CO₂
  wasteKg:      0.5,    // per kg of mixed waste
}

export interface CarbonInputs {
  carKm:         number
  busKm:         number
  bikeKm:        number
  walkKm:        number
  acHours:       number
  electricityKwh:number
  waterLiters:   number
  wasteKg:       number
}

export interface CarbonBreakdown {
  transport: number
  ac:        number
  electricity:number
  water:     number
  waste:     number
  total:     number
  weeklyTotal: number
}

export interface CarbonTip {
  icon:  string
  tip:   string
  saving:string
}

export function calculateCarbon(inputs: CarbonInputs): CarbonBreakdown {
  const transport =
    inputs.carKm * EMISSION_FACTORS.carKm +
    inputs.busKm * EMISSION_FACTORS.busKm

  const ac      = inputs.acHours * EMISSION_FACTORS.acHour
  const electricity = inputs.electricityKwh * EMISSION_FACTORS.electricityKwh
  const water   = inputs.waterLiters * EMISSION_FACTORS.waterLiters
  const waste   = inputs.wasteKg * EMISSION_FACTORS.wasteKg

  const total = round(transport + ac + electricity + water + waste)
  return {
    transport: round(transport),
    ac:        round(ac),
    electricity: round(electricity),
    water:     round(water),
    waste:     round(waste),
    total,
    weeklyTotal: round(total * 7),
  }
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

export function getCarbonTips(breakdown: CarbonBreakdown): CarbonTip[] {
  const tips: CarbonTip[] = []

  const sorted = Object.entries({
    transport:   breakdown.transport,
    ac:          breakdown.ac,
    electricity: breakdown.electricity,
    water:       breakdown.water,
    waste:       breakdown.waste,
  }).sort(([, a], [, b]) => b - a)

  const topCategory = sorted[0][0]

  // Always include relevant top tip
  if (topCategory === "transport" && breakdown.transport > 0) {
    tips.push({
      icon:   "🚌",
      tip:    "Switch to public transport or cycle for trips under 10 km",
      saving: `Could save ~${round(breakdown.transport * 0.7)} kg CO₂/day`,
    })
  }
  if (topCategory === "ac" && breakdown.ac > 0) {
    tips.push({
      icon:   "🌡️",
      tip:    "Set AC to 24–26°C and use a ceiling fan to feel cooler",
      saving: `Could save ~${round(breakdown.ac * 0.3)} kg CO₂/day`,
    })
  }
  if (topCategory === "electricity" && breakdown.electricity > 0) {
    tips.push({
      icon:   "💡",
      tip:    "Switch to LED bulbs & use appliances during off-peak hours",
      saving: `Could save ~${round(breakdown.electricity * 0.25)} kg CO₂/day`,
    })
  }
  if (breakdown.water > 0.05) {
    tips.push({
      icon:   "💧",
      tip:    "Reduce shower time by 2 minutes to save ~20L of water daily",
      saving: `~${round(20 * EMISSION_FACTORS.waterLiters)} kg CO₂/day`,
    })
  }
  if (breakdown.waste > 0.3) {
    tips.push({
      icon:   "♻️",
      tip:    "Segregate wet and dry waste — recycling cuts landfill emissions by ~40%",
      saving: `~${round(breakdown.waste * 0.4)} kg CO₂/day`,
    })
  }
  if (breakdown.transport < 1) {
    tips.push({
      icon:   "🌿",
      tip:    "Great job keeping transport emissions low! Consider carpooling on longer trips.",
      saving: "Stay green!",
    })
  }

  // Always add a universal tip
  tips.push({
    icon:   "🌳",
    tip:    "Plant one tree this week — each absorbs ~21 kg CO₂/year",
    saving: "Long-term impact",
  })

  return tips.slice(0, 4)
}
