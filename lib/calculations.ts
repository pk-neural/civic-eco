import type { WeatherData, GreenMetrics, DailyInput, EcoScore, CityImpact, Badge, DailyGreenIndex } from "./types"

// Baselines for eco calculations - India average values
const BASELINES = {
  water: 135, // India daily average per capita in liters
  acFan: 6, // India average AC/Fan hours per day
  transport: { walk: 0, cycle: 0, public: 2, private: 10 }, // carbon units
}

const INDIA_BASELINE = {
  avgGreenIndex: 55, // National average green index
  avgWaterUsage: 135,
  avgAcHours: 6,
  avgTransportCarbon: 5,
}

export function calculateGreenMetrics(weather: WeatherData, userInput?: DailyInput): GreenMetrics {
  // Energy Stress: Based on temperature and AC usage
  let energyStress = 0
  if (weather.temperature > 35) energyStress += 40
  else if (weather.temperature > 30) energyStress += 25
  else if (weather.temperature > 25) energyStress += 10

  if (userInput && userInput.acFanHours > 6) energyStress += 30
  else if (userInput && userInput.acFanHours > 4) energyStress += 15

  energyStress = Math.min(100, energyStress)

  // Water Stress: Based on humidity and water usage
  let waterStress = 0
  if (weather.humidity < 30) waterStress += 40
  else if (weather.humidity < 50) waterStress += 20

  if (userInput && userInput.waterUsage > 150) waterStress += 40
  else if (userInput && userInput.waterUsage > 100) waterStress += 20

  waterStress = Math.min(100, waterStress)

  // Air Quality: Inverse of AQI (higher AQI = lower air quality score)
  const airQuality = Math.max(0, 100 - weather.aqi)

  // Solar Potential: Based on UV index and weather
  let solarPotential = weather.uvIndex * 10
  if (weather.condition === "Clear") solarPotential += 20
  else if (weather.condition === "Partly Cloudy") solarPotential += 10
  solarPotential = Math.min(100, solarPotential)

  // Uses weighted average that properly reflects bad days
  let greenIndex = 0

  // Base score from environmental factors (max 60 points)
  greenIndex += (100 - energyStress) * 0.15 // max 15
  greenIndex += (100 - waterStress) * 0.15 // max 15
  greenIndex += airQuality * 0.2 // max 20
  greenIndex += solarPotential * 0.1 // max 10

  // User behavior bonus (max 40 points)
  if (userInput) {
    // Water behavior (max 10)
    if (userInput.waterUsage < 100) greenIndex += 10
    else if (userInput.waterUsage < 135) greenIndex += 5
    else greenIndex -= 5 // Penalty for over baseline

    // Energy behavior (max 10)
    if (userInput.acFanHours < 4) greenIndex += 10
    else if (userInput.acFanHours < 6) greenIndex += 5
    else greenIndex -= 5 // Penalty for over baseline

    // Transport (max 10)
    if (userInput.transportMode === "walk" || userInput.transportMode === "cycle") greenIndex += 10
    else if (userInput.transportMode === "public") greenIndex += 6
    else greenIndex += 0 // Private = no bonus

    // Waste segregation (max 5)
    if (userInput.wasteSegregation) greenIndex += 5
    else greenIndex -= 3 // Penalty for not segregating

    // Outdoor exposure (max 5)
    if (userInput.outdoorExposure === "high") greenIndex += 5
    else if (userInput.outdoorExposure === "medium") greenIndex += 2
  } else {
    // No user input - assume average behavior
    greenIndex += 15
  }

  if (weather.aqi > 100 && greenIndex > 85) {
    greenIndex = 85
  }
  if (weather.aqi > 200 && greenIndex > 60) {
    greenIndex = 60
  }

  greenIndex = Math.min(100, Math.max(0, Math.round(greenIndex)))

  return {
    greenIndex,
    energyStress: Math.round(energyStress),
    waterStress: Math.round(waterStress),
    airQuality: Math.round(airQuality),
    solarPotential: Math.round(solarPotential),
  }
}

export function calculateEcoScore(input: DailyInput, previousScore: EcoScore): EcoScore {
  let waterCredit = previousScore.waterCredit
  let energyCredit = previousScore.energyCredit
  let transportCredit = previousScore.transportCredit
  let wasteCredit = previousScore.wasteCredit
  let debt = previousScore.debt

  // Water: Baseline 100L
  if (input.waterUsage < BASELINES.water) {
    waterCredit += Math.round((BASELINES.water - input.waterUsage) / 10)
  } else {
    const penalty = Math.round((input.waterUsage - BASELINES.water) / 10)
    debt += penalty
  }

  // Energy: Baseline 4 hours
  if (input.acFanHours < BASELINES.acFan) {
    energyCredit += Math.round((BASELINES.acFan - input.acFanHours) * 2)
  } else {
    const penalty = Math.round((input.acFanHours - BASELINES.acFan) * 2)
    debt += penalty
  }

  // Transport
  const transportValue = BASELINES.transport[input.transportMode]
  if (transportValue < BASELINES.transport.private) {
    transportCredit += BASELINES.transport.private - transportValue
  }

  // Waste
  if (input.wasteSegregation) {
    wasteCredit += 5
  } else {
    debt += 2
  }

  const totalScore = waterCredit + energyCredit + transportCredit + wasteCredit - debt

  return { waterCredit, energyCredit, transportCredit, wasteCredit, totalScore, debt }
}

export function calculateCityImpact(inputs: DailyInput[]): CityImpact {
  let waterSaved = 0
  let energyReduced = 0

  inputs.forEach((input) => {
    if (input.waterUsage < BASELINES.water) {
      waterSaved += BASELINES.water - input.waterUsage
    }
    if (input.acFanHours < BASELINES.acFan) {
      energyReduced += (BASELINES.acFan - input.acFanHours) * 0.5 // kWh
    }
  })

  const co2Avoided = energyReduced * 0.82 // kg CO2 per kWh

  return {
    waterSaved,
    energyReduced,
    co2Avoided: Math.round(co2Avoided * 10) / 10,
    householdsSupplied: Math.round(waterSaved / 150), // avg household daily water
    streetlightsPowered: Math.round(energyReduced / 0.1), // 100W streetlight hours
    treesEquivalent: Math.round(co2Avoided / 21), // trees absorb ~21kg CO2/year
  }
}

export function checkBadges(inputs: DailyInput[], badges: Badge[]): Badge[] {
  const updatedBadges = [...badges]

  // Eco Starter: First input
  if (inputs.length >= 1) {
    const badge = updatedBadges.find((b) => b.id === "eco-starter")
    if (badge && !badge.earned) {
      badge.earned = true
      badge.earnedAt = new Date().toISOString()
    }
  }

  // Water Saver: 3 days under 100L
  const waterSaverDays = inputs.filter((i) => i.waterUsage < 100).length
  if (waterSaverDays >= 3) {
    const badge = updatedBadges.find((b) => b.id === "water-saver")
    if (badge && !badge.earned) {
      badge.earned = true
      badge.earnedAt = new Date().toISOString()
    }
  }

  // Energy Aware: 5 days under 4 hours AC
  const energyAwareDays = inputs.filter((i) => i.acFanHours < 4).length
  if (energyAwareDays >= 5) {
    const badge = updatedBadges.find((b) => b.id === "energy-aware")
    if (badge && !badge.earned) {
      badge.earned = true
      badge.earnedAt = new Date().toISOString()
    }
  }

  // Air Guardian: 7 days non-private transport
  const airGuardianDays = inputs.filter((i) => i.transportMode !== "private").length
  if (airGuardianDays >= 7) {
    const badge = updatedBadges.find((b) => b.id === "air-guardian")
    if (badge && !badge.earned) {
      badge.earned = true
      badge.earnedAt = new Date().toISOString()
    }
  }

  // Solar Hero: 5 days high outdoor exposure
  const solarHeroDays = inputs.filter((i) => i.outdoorExposure === "high").length
  if (solarHeroDays >= 5) {
    const badge = updatedBadges.find((b) => b.id === "solar-hero")
    if (badge && !badge.earned) {
      badge.earned = true
      badge.earnedAt = new Date().toISOString()
    }
  }

  return updatedBadges
}

export function getWasteRecommendation(
  wasteType: "e-waste" | "dry" | "wet" | "hazardous" | "mixed",
  condition: "working" | "broken" | "expired" | "contaminated",
): {
  action: "reduce" | "reuse" | "recycle" | "recover"
  whatToDo: string[]
  whatToAvoid: string[]
  whyItMatters: string
  ecoCredits: number
} {
  const recommendations = {
    "e-waste": {
      working: {
        action: "reuse" as const,
        whatToDo: ["Donate to schools or NGOs", "Sell on second-hand platforms", "Repurpose for other uses"],
        whatToAvoid: ["Throwing in regular trash", "Burning e-waste", "Dismantling without safety gear"],
        whyItMatters:
          "E-waste contains valuable metals that can be recovered and toxic materials that need proper handling.",
        ecoCredits: 10,
      },
      broken: {
        action: "recycle" as const,
        whatToDo: [
          "Take to authorized e-waste collection center",
          "Contact manufacturer take-back program",
          "Use government e-waste drives",
        ],
        whatToAvoid: ["Mixing with regular waste", "Informal recycling", "Storing broken electronics long-term"],
        whyItMatters:
          "Proper e-waste recycling recovers gold, copper, and rare earth elements while preventing toxic leakage.",
        ecoCredits: 8,
      },
    },
    dry: {
      working: {
        action: "reuse" as const,
        whatToDo: ["Use paper for crafts", "Donate usable items", "Repurpose containers"],
        whatToAvoid: ["Single-use mentality", "Mixing with wet waste", "Burning"],
        whyItMatters: "Reusing dry waste reduces demand for new raw materials and saves energy.",
        ecoCredits: 5,
      },
      broken: {
        action: "recycle" as const,
        whatToDo: ["Segregate by material type", "Clean before recycling", "Use designated bins"],
        whatToAvoid: ["Contaminating recyclables", "Sending to landfill", "Mixing different plastics"],
        whyItMatters: "Clean, segregated dry waste has higher recycling value and reduces landfill burden.",
        ecoCredits: 4,
      },
    },
    wet: {
      working: {
        action: "reduce" as const,
        whatToDo: ["Plan meals to reduce waste", "Store food properly", "Use leftovers creatively"],
        whatToAvoid: ["Over-purchasing perishables", "Improper storage", "Ignoring expiry dates"],
        whyItMatters: "Food waste in landfills produces methane, a potent greenhouse gas.",
        ecoCredits: 6,
      },
      expired: {
        action: "recover" as const,
        whatToDo: ["Compost at home", "Use biogas plants", "Municipal composting programs"],
        whatToAvoid: ["Sending to landfill", "Mixing with dry waste", "Open dumping"],
        whyItMatters: "Composting wet waste creates nutrient-rich soil and prevents methane emissions.",
        ecoCredits: 7,
      },
    },
    hazardous: {
      contaminated: {
        action: "recycle" as const,
        whatToDo: ["Contact hazardous waste facility", "Use collection drives", "Store safely until disposal"],
        whatToAvoid: ["Regular trash disposal", "Pouring down drains", "Burning"],
        whyItMatters: "Hazardous waste can contaminate soil and groundwater, affecting health for generations.",
        ecoCredits: 12,
      },
      expired: {
        action: "recycle" as const,
        whatToDo: ["Return medicines to pharmacies", "Use authorized disposal", "Check local guidelines"],
        whatToAvoid: ["Flushing medicines", "Regular trash", "Burning chemicals"],
        whyItMatters: "Proper hazardous waste disposal protects ecosystems and human health.",
        ecoCredits: 10,
      },
    },
    mixed: {
      contaminated: {
        action: "reduce" as const,
        whatToDo: ["Segregate at source", "Use separate bins", "Educate household members"],
        whatToAvoid: ["Single bin for all waste", "Last-minute sorting", "Ignoring segregation"],
        whyItMatters: "Mixed waste is difficult to process and usually ends up in landfills.",
        ecoCredits: 3,
      },
      broken: {
        action: "reduce" as const,
        whatToDo: ["Start segregating immediately", "Learn local waste categories", "Use color-coded bins"],
        whatToAvoid: ["Continuing mixed disposal", "Assuming someone else will sort", "Ignoring guidelines"],
        whyItMatters: "Proper segregation increases recycling rates and reduces environmental impact.",
        ecoCredits: 3,
      },
    },
  }

  const wasteRec = recommendations[wasteType]
  const conditionRec =
    wasteRec[condition as keyof typeof wasteRec] || wasteRec[Object.keys(wasteRec)[0] as keyof typeof wasteRec]

  return conditionRec as {
    action: "reduce" | "reuse" | "recycle" | "recover"
    whatToDo: string[]
    whatToAvoid: string[]
    whyItMatters: string
    ecoCredits: number
  }
}

export function calculateDailyGreenIndex(input: DailyInput, previousScores?: DailyGreenIndex[]): DailyGreenIndex {
  // Start from India baseline instead of 100
  let score = INDIA_BASELINE.avgGreenIndex

  // Water penalty/bonus: Baseline 135L
  let waterPenalty = 0
  if (input.waterUsage > BASELINES.water) {
    // Penalty: -3 points per 10L over baseline (stronger penalty)
    waterPenalty = Math.round(((input.waterUsage - BASELINES.water) / 10) * 3)
    score -= waterPenalty
  } else {
    // Bonus: +2 points per 10L under baseline
    const bonus = Math.round(((BASELINES.water - input.waterUsage) / 10) * 2)
    waterPenalty = -bonus
    score += bonus
  }

  // Energy penalty/bonus: Baseline 6 hours
  let energyPenalty = 0
  if (input.acFanHours > BASELINES.acFan) {
    // Penalty: -4 points per hour over baseline (stronger penalty)
    energyPenalty = Math.round((input.acFanHours - BASELINES.acFan) * 4)
    score -= energyPenalty
  } else {
    // Bonus: +3 points per hour under baseline
    const bonus = Math.round((BASELINES.acFan - input.acFanHours) * 3)
    energyPenalty = -bonus
    score += bonus
  }

  // Transport bonus: Baseline is private vehicle (0 bonus)
  let transportBonus = 0
  if (input.transportMode === "walk") {
    transportBonus = 12
  } else if (input.transportMode === "cycle") {
    transportBonus = 10
  } else if (input.transportMode === "public") {
    transportBonus = 6
  } else {
    // Private transport penalty
    transportBonus = -5
  }
  score += transportBonus

  // Waste segregation bonus/penalty
  let wasteBonus = 0
  if (input.wasteSegregation) {
    wasteBonus = 5
    score += wasteBonus
  } else {
    // Stronger penalty for not segregating
    wasteBonus = -5
    score -= 5
  }

  // Outdoor exposure bonus
  let outdoorBonus = 0
  if (input.outdoorExposure === "high") {
    outdoorBonus = 5
    score += outdoorBonus
  } else if (input.outdoorExposure === "medium") {
    outdoorBonus = 2
    score += outdoorBonus
  }

  if (previousScores && previousScores.length > 0) {
    const prevScore = previousScores[0].score
    // If today is worse than yesterday, apply additional penalty (bad days pull down)
    if (score < prevScore) {
      const momentumPenalty = Math.round((prevScore - score) * 0.2)
      score -= momentumPenalty
    }
    // If today is better, apply gradual improvement (good days increase slowly)
    else if (score > prevScore) {
      const improvement = score - prevScore
      // Cap improvement to max 10 points per day
      const cappedImprovement = Math.min(improvement, 10)
      score = prevScore + cappedImprovement
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)))

  return {
    date: input.date,
    userId: input.userId,
    score,
    breakdown: {
      waterPenalty,
      energyPenalty,
      transportBonus,
      wasteBonus,
      outdoorBonus,
    },
  }
}

export function calculateWeeklyAverage(dailyScores: DailyGreenIndex[]): number {
  if (dailyScores.length === 0) return 0
  const sum = dailyScores.reduce((acc, day) => acc + day.score, 0)
  return Math.round(sum / dailyScores.length)
}

export function calculateProgress(dailyScores: DailyGreenIndex[]): number {
  const last7Days = dailyScores.slice(0, 7)
  if (last7Days.length === 0) return 0

  // Weight recent days more heavily
  let weightedSum = 0
  let totalWeight = 0

  last7Days.forEach((day, index) => {
    const weight = last7Days.length - index // More recent = higher weight
    weightedSum += day.score * weight
    totalWeight += weight
  })

  return Math.round(weightedSum / totalWeight)
}

export function getSustainabilityStatus(greenIndex: number): { label: string; color: string } {
  if (greenIndex >= 85) return { label: "Excellent", color: "text-emerald-400" }
  if (greenIndex >= 70) return { label: "Good", color: "text-teal-400" }
  if (greenIndex >= 50) return { label: "Moderate", color: "text-amber-400" }
  if (greenIndex >= 30) return { label: "Needs Improvement", color: "text-orange-400" }
  return { label: "Poor", color: "text-red-400" }
}
