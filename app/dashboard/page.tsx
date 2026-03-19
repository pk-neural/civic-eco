"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Zap, Droplets, Wind, Sun, Loader2, TrendingUp, TrendingDown } from "lucide-react"
import { Header } from "@/components/header"
import { WeatherCard } from "@/components/weather-card"
import { GreenIndexCard } from "@/components/green-index-card"
import { MetricCard } from "@/components/metric-card"
import { FloatingParticles } from "@/components/particles"
import { AQIForecastChart } from "@/components/aqi-forecast-chart"
import { AIRecommendations } from "@/components/ai-recommendations"
import { AIAssistant } from "@/components/ai-assistant"
import { EventBanner } from "@/components/event-banner"
import { EnvironmentNews } from "@/components/environment-news"
import { CarbonFootprint } from "@/components/carbon-footprint"
import { getUser, getTodayInput, getDailyInputs, getDailyGreenIndexScores } from "@/lib/storage"
import { getWeatherData } from "@/lib/api"
import { calculateGreenMetrics, calculateCityImpact, calculateProgress } from "@/lib/calculations"
import { predictAQI } from "@/lib/ai/aqiPredictor"
import { getRecommendations, sortRecommendations } from "@/lib/ai/recommendationEngine"
import type { User, WeatherData, GreenMetrics, CityImpact, DailyGreenIndex, AQIForecast, Recommendation } from "@/lib/types"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [metrics, setMetrics] = useState<GreenMetrics | null>(null)
  const [impact, setImpact] = useState<CityImpact | null>(null)
  const [loading, setLoading] = useState(true)
  const [dailyScores, setDailyScores] = useState<DailyGreenIndex[]>([])
  const [progressPercent, setProgressPercent] = useState(0)
  // AI state
  const [aiForecast, setAIForecast] = useState<AQIForecast | null>(null)
  const [aiRecs, setAIRecs] = useState<Recommendation[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)

      const weatherData = await getWeatherData(currentUser.lat, currentUser.lon)
      setWeather(weatherData)

      const todayInput = await getTodayInput(currentUser.id)
      const greenMetrics = calculateGreenMetrics(weatherData, todayInput || undefined)
      setMetrics(greenMetrics)

      const allInputs = (await getDailyInputs()).filter((i) => i.userId === currentUser.id)
      const cityImpact = calculateCityImpact(allInputs)
      setImpact(cityImpact)

      const scores = await getDailyGreenIndexScores(currentUser.id)
      setDailyScores(scores)
      const progress = calculateProgress(scores)
      setProgressPercent(progress)

      setLoading(false)

      // Load AI features in background
      const [aiForecastData, aiRecsData] = await Promise.all([
        predictAQI(weatherData),
        getRecommendations({ weather: weatherData, dailyInput: todayInput }),
      ])
      if (aiForecastData) setAIForecast(aiForecastData)
      setAIRecs(sortRecommendations(aiRecsData))
    }

    fetchData()
  }, [router])

  if (loading || !user || !weather || !metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const trend = dailyScores.length >= 2 ? dailyScores[0].score - dailyScores[1].score : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here&apos;s your environmental overview for {user.city}.
          </p>
        </div>

        <div className="grid gap-6">
          {/* ── Environmental Events Banner ── */}
          <EventBanner />

          {/* Weather and Green Index Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            <WeatherCard weather={weather} city={`${user.city}, ${user.state}`} />
            <GreenIndexCard
              metrics={metrics}
              todayScore={dailyScores.length > 0 ? dailyScores[0].score : undefined}
              progressPercent={progressPercent}
            />
          </div>

          {/* 7-Day Progress */}
          {dailyScores.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">7-Day Progress</span>
                  {trend > 0 ? (
                    <div className="flex items-center gap-1 text-emerald-400 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>+{trend}</span>
                    </div>
                  ) : trend < 0 ? (
                    <div className="flex items-center gap-1 text-red-400 text-sm">
                      <TrendingDown className="h-4 w-4" />
                      <span>{trend}</span>
                    </div>
                  ) : null}
                </div>
                <span
                  className={`font-bold ${
                    progressPercent >= 80
                      ? "text-emerald-400"
                      : progressPercent >= 60
                        ? "text-teal-400"
                        : progressPercent >= 40
                          ? "text-amber-400"
                          : "text-red-400"
                  }`}
                >
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    progressPercent >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : progressPercent >= 60
                        ? "bg-gradient-to-r from-teal-500 to-cyan-400"
                        : progressPercent >= 40
                          ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                          : "bg-gradient-to-r from-red-500 to-orange-400"
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Energy Stress"
              value={metrics.energyStress}
              suffix="%"
              icon={Zap}
              color={metrics.energyStress > 60 ? "red" : metrics.energyStress > 30 ? "amber" : "emerald"}
              description="Based on temperature and usage"
              showProgress
            />
            <MetricCard
              title="Water Stress"
              value={metrics.waterStress}
              suffix="%"
              icon={Droplets}
              color={metrics.waterStress > 60 ? "red" : metrics.waterStress > 30 ? "amber" : "blue"}
              description="Based on humidity and usage"
              showProgress
            />
            <MetricCard
              title="Air Quality"
              value={metrics.airQuality}
              suffix="%"
              icon={Wind}
              color={metrics.airQuality > 60 ? "emerald" : metrics.airQuality > 30 ? "amber" : "red"}
              description="Inverse of AQI rating"
              showProgress
            />
            <MetricCard
              title="Solar Potential"
              value={metrics.solarPotential}
              suffix="%"
              icon={Sun}
              color="amber"
              description="Based on UV and weather"
              showProgress
            />
          </div>

          {/* City Impact Section */}
          {impact && (
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Your City Impact</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Water Saved</p>
                  <p className="text-2xl font-bold text-blue-400">{impact.waterSaved} L</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enough for {impact.householdsSupplied} households
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">Energy Reduced</p>
                  <p className="text-2xl font-bold text-amber-400">{impact.energyReduced} kWh</p>
                  <p className="text-xs text-muted-foreground mt-1">Powers {impact.streetlightsPowered} streetlights</p>
                </div>
                <div className="p-4 bg-white/5 rounded-lg">
                  <p className="text-sm text-muted-foreground">CO2 Avoided</p>
                  <p className="text-2xl font-bold text-emerald-400">{impact.co2Avoided} kg</p>
                  <p className="text-xs text-muted-foreground mt-1">Equivalent to {impact.treesEquivalent} trees</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Carbon Footprint Calculator ── */}
          <CarbonFootprint />

          {/* ── AI Forecast & Recommendations ── */}
          <div className="grid lg:grid-cols-2 gap-6">
            {aiForecast ? (
              <AQIForecastChart forecast={aiForecast} compact />
            ) : (
              <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
            )}
            {aiRecs.length > 0 ? (
              <AIRecommendations recommendations={aiRecs} compact />
            ) : (
              <div className="h-40 rounded-xl bg-white/5 animate-pulse" />
            )}
          </div>

          {/* ── Environmental News (last section) ── */}
          <EnvironmentNews />
        </div>
      </main>

      {/* Floating AI Assistant */}
      <AIAssistant
        context={{
          city:        user.city,
          aqi:         weather.aqi,
          aqiCategory: aiForecast?.current_category,
          temperature: weather.temperature,
          humidity:    weather.humidity,
          windSpeed:   weather.windSpeed,
          condition:   weather.condition,
        }}
      />
    </div>
  )
}
