export interface User {
  id: string
  email: string
  city: string
  state: string
  lat: number
  lon: number
  createdAt: string
}

export interface DailyInput {
  id: string
  userId: string
  date: string
  acFanHours: number
  waterUsage: number
  outdoorExposure: "low" | "medium" | "high"
  transportMode: "walk" | "cycle" | "public" | "private"
  wasteSegregation: boolean
  timestamp: string
  locked: boolean
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
  aqi: number
  condition: string
}

export interface GreenMetrics {
  greenIndex: number
  energyStress: number
  waterStress: number
  airQuality: number
  solarPotential: number
}

export interface EcoScore {
  waterCredit: number
  energyCredit: number
  transportCredit: number
  wasteCredit: number
  totalScore: number
  debt: number
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earned: boolean
  earnedAt?: string
}

export interface ForecastDay {
  date: string
  tempMax: number
  tempMin: number
  rainProbability: number
  aqi: number
  condition: string
}

export interface CityImpact {
  waterSaved: number
  energyReduced: number
  co2Avoided: number
  householdsSupplied: number
  streetlightsPowered: number
  treesEquivalent: number
}

export interface DailyGreenIndex {
  date: string
  userId: string
  score: number
  breakdown: {
    waterPenalty: number
    energyPenalty: number
    transportBonus: number
    wasteBonus: number
    outdoorBonus: number
  }
}

export interface WasteDecision {
  type: "e-waste" | "dry" | "wet" | "hazardous" | "mixed"
  action: string    // "Reuse" | "Recycle" | "Compost" | "Safe Disposal" | "Segregate" | legacy
  whatToDo: string[]
  whatToAvoid: string[]
  whyItMatters: string
  ecoCredits: number
}

// ─── AI Feature Types ─────────────────────────────────────────────────────

export interface AQIForecastPoint {
  hours: 24 | 48 | 72
  aqi: number
  category: string
  color: string
}

export interface AQIForecast {
  forecast: AQIForecastPoint[]
  current_aqi: number
  current_category: string
}

export interface AIEcoScore {
  score: number
  category: "Eco-Friendly" | "Moderate" | "High Impact"
  insights: string[]
  breakdown: {
    water_score: number
    energy_score: number
    transport_score: number
    waste_score: number
    outdoor_score: number
  }
}

export interface Recommendation {
  icon: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: "air" | "energy" | "transport" | "water" | "waste"
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp?: string
}
