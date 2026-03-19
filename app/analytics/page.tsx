"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Trophy,
  Leaf,
  Droplets,
  Zap,
  Wind,
  Sun,
  TrendingUp,
  Award,
  Target,
  ArrowRight,
  CheckCircle2,
  Circle,
  TrendingDown,
} from "lucide-react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { AnimatedCounter } from "@/components/animated-counter"
import { getUser, getDailyInputs, getEcoScore, getBadges, updateBadges, getDailyGreenIndexScores } from "@/lib/storage"
import {
  checkBadges,
  calculateCityImpact,
  calculateWeeklyAverage,
  calculateProgress,
  getSustainabilityStatus,
} from "@/lib/calculations"
import type { User, DailyInput, EcoScore, Badge, DailyGreenIndex } from "@/lib/types"

const IMPACT_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981"]

const badgeIcons: Record<string, React.ElementType> = {
  Leaf: Leaf,
  Droplets: Droplets,
  Zap: Zap,
  Trophy: Trophy,
  Wind: Wind,
  Sun: Sun,
}

export default function AnalyticsPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [inputs, setInputs] = useState<DailyInput[]>([])
  const [ecoScore, setEcoScore] = useState<EcoScore | null>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [dailyScores, setDailyScores] = useState<DailyGreenIndex[]>([])
  const [weeklyAverage, setWeeklyAverage] = useState(0)
  const [progressPercent, setProgressPercent] = useState(0)

  useEffect(() => {
    const fetchAnalytics = async () => {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)

      const allInputs = await getDailyInputs()
      const userInputs = allInputs
        .filter((i) => i.userId === currentUser.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setInputs(userInputs)

      setEcoScore(await getEcoScore())

      // Check and update badges
      const currentBadges = await getBadges()
      const updatedBadges = checkBadges(userInputs, currentBadges)
      await updateBadges(updatedBadges)
      setBadges(updatedBadges)

      const scores = await getDailyGreenIndexScores(currentUser.id)
      setDailyScores(scores)

      const last7Days = scores.slice(0, 7)
      const avg = calculateWeeklyAverage(last7Days)
      setWeeklyAverage(avg)

      const progress = calculateProgress(scores)
      setProgressPercent(progress)

      setLoading(false)
    }
    fetchAnalytics()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  // Calculate impact data for pie chart
  const impactData =
    ecoScore &&
    (ecoScore.energyCredit > 0 || ecoScore.waterCredit > 0 || ecoScore.transportCredit > 0 || ecoScore.wasteCredit > 0)
      ? [
          { name: "Energy", value: Math.max(ecoScore.energyCredit, 1), color: "#f59e0b" },
          { name: "Water", value: Math.max(ecoScore.waterCredit, 1), color: "#3b82f6" },
          { name: "Transport", value: Math.max(ecoScore.transportCredit, 1), color: "#8b5cf6" },
          { name: "Waste", value: Math.max(ecoScore.wasteCredit, 1), color: "#10b981" },
        ]
      : [
          { name: "Energy", value: 1, color: "#f59e0b" },
          { name: "Water", value: 1, color: "#3b82f6" },
          { name: "Transport", value: 1, color: "#8b5cf6" },
          { name: "Waste", value: 1, color: "#10b981" },
        ]

  const earnedBadges = badges.filter((b) => b.earned)

  const cityImpact = calculateCityImpact(inputs)
  const daysToReward = Math.max(0, 7 - inputs.length)

  const status = getSustainabilityStatus(weeklyAverage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your sustainability progress and earn rewards.</p>
        </div>

        <div className="grid gap-6">
          {/* Weekly Summary - Now using real calculated averages */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-emerald-500/20 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Weekly Summary</h2>
                  <p className="text-sm text-muted-foreground">{Math.min(dailyScores.length, 7)} of 7 days tracked</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Average Green Index</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    <AnimatedCounter value={weeklyAverage} />
                    /100
                  </span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                    style={{ width: `${weeklyAverage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-muted-foreground">Sustainability Status</span>
                  <span className={`font-semibold ${status.color}`}>{status.label}</span>
                </div>

                {dailyScores.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-sm text-muted-foreground mb-3">Last 7 Days Performance</p>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 7 }).map((_, i) => {
                        const score = dailyScores[6 - i]
                        const dayLabels = ["S", "M", "T", "W", "T", "F", "S"]
                        const dayOfWeek = new Date()
                        dayOfWeek.setDate(dayOfWeek.getDate() - (6 - i))
                        return (
                          <div key={i} className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">{dayLabels[dayOfWeek.getDay()]}</div>
                            <div
                              className={`h-8 rounded flex items-center justify-center text-xs font-medium ${
                                score
                                  ? score.score >= 80
                                    ? "bg-emerald-500/30 text-emerald-400"
                                    : score.score >= 60
                                      ? "bg-teal-500/30 text-teal-400"
                                      : score.score >= 40
                                        ? "bg-amber-500/30 text-amber-400"
                                        : "bg-red-500/30 text-red-400"
                                  : "bg-white/5 text-muted-foreground"
                              }`}
                            >
                              {score ? score.score : "-"}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Impact Pie Chart */}
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Impact Distribution</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={impactData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {impactData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={IMPACT_COLORS[index % IMPACT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(0,0,0,0.8)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* ... existing code for points display ... */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <span className="text-muted-foreground">Energy:</span>
                  <span className="text-foreground font-medium">{ecoScore?.energyCredit || 0} pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Water:</span>
                  <span className="text-foreground font-medium">{ecoScore?.waterCredit || 0} pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground">Transport:</span>
                  <span className="text-foreground font-medium">{ecoScore?.transportCredit || 0} pts</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <span className="text-muted-foreground">Waste:</span>
                  <span className="text-foreground font-medium">{ecoScore?.wasteCredit || 0} pts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Award className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Badges</h2>
                <p className="text-sm text-muted-foreground">
                  {earnedBadges.length} of {badges.length} earned
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => {
                const IconComponent = badgeIcons[badge.icon] || Award
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-xl border transition-all ${
                      badge.earned
                        ? "bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30"
                        : "bg-white/5 border-white/10 opacity-60"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${badge.earned ? "bg-amber-500/30 text-amber-400" : "bg-white/10 text-muted-foreground"}`}
                      >
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-foreground">{badge.name}</h3>
                          {badge.earned ? (
                            <CheckCircle2 className="h-4 w-4 text-amber-400" />
                          ) : (
                            <Circle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                        {badge.earned && badge.earnedAt && (
                          <p className="text-xs text-amber-400 mt-2">
                            Earned {new Date(badge.earnedAt).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rewards & Prize Pool - Using real progress calculation */}
          <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Rewards & Prize Pool</h2>
                <p className="text-sm text-muted-foreground">Compete for amazing prizes!</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 rounded-xl text-center">
                <p className="text-3xl font-bold text-amber-400">Rs. 1,00,000</p>
                <p className="text-sm text-foreground font-medium mt-1">City Green Champion</p>
                <p className="text-xs text-muted-foreground mt-1">Highest weekly Green Index</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-slate-400/20 to-slate-500/10 border border-slate-400/30 rounded-xl text-center">
                <p className="text-3xl font-bold text-slate-300">Rs. 75,000</p>
                <p className="text-sm text-foreground font-medium mt-1">Top 5% Users</p>
                <p className="text-xs text-muted-foreground mt-1">Consistent high performers</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 rounded-xl text-center">
                <p className="text-3xl font-bold text-orange-400">Rs. 50,000</p>
                <p className="text-sm text-foreground font-medium mt-1">Weekly Achievers</p>
                <p className="text-xs text-muted-foreground mt-1">Complete 7 days streak</p>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-emerald-400" />
                  <span className="text-foreground font-medium">Your Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{Math.min(dailyScores.length, 7)}/7 days</span>
                  {dailyScores.length >= 2 &&
                    (dailyScores[0].score > dailyScores[1].score ? (
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                    ) : dailyScores[0].score < dailyScores[1].score ? (
                      <TrendingDown className="h-4 w-4 text-red-400" />
                    ) : null)}
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
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
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  {daysToReward > 0 ? (
                    <>
                      <span className="text-emerald-400 font-medium">{daysToReward} days</span> to complete the week
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <span className="text-emerald-400">Week completed! Average: {weeklyAverage}/100</span>
                  )}
                </p>
                <p className="text-sm font-medium">
                  <span className={status.color}>{progressPercent}%</span>
                </p>
              </div>
            </div>
          </div>

          {/* Government & City Impact */}
          <div className="bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Government & City Impact</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Your contributions help make {user.city} more sustainable
            </p>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Droplets className="h-5 w-5 text-blue-400" />
                  <span className="text-sm text-muted-foreground">Water Saved</span>
                </div>
                <p className="text-2xl font-bold text-blue-400">{cityImpact.waterSaved} L</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supplies {cityImpact.householdsSupplied} households daily
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-5 w-5 text-amber-400" />
                  <span className="text-sm text-muted-foreground">Energy Reduced</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{cityImpact.energyReduced} kWh</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Powers {cityImpact.streetlightsPowered} streetlights
                </p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-5 w-5 text-emerald-400" />
                  <span className="text-sm text-muted-foreground">CO2 Avoided</span>
                </div>
                <p className="text-2xl font-bold text-emerald-400">{cityImpact.co2Avoided} kg</p>
                <p className="text-xs text-muted-foreground mt-1">Equivalent to {cityImpact.treesEquivalent} trees</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
