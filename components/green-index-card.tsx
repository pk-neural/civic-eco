"use client"

import { Leaf, TrendingUp } from "lucide-react"
import type { GreenMetrics } from "@/lib/types"
import { AnimatedCounter } from "./animated-counter"
import { getSustainabilityStatus } from "@/lib/calculations"

interface GreenIndexCardProps {
  metrics: GreenMetrics
  todayScore?: number // Added today's calculated green index score
  progressPercent?: number // Added 7-day progress percentage
}

export function GreenIndexCard({ metrics, todayScore, progressPercent }: GreenIndexCardProps) {
  const displayScore = todayScore !== undefined ? todayScore : metrics.greenIndex

  const getIndexColor = (value: number) => {
    if (value >= 85) return "text-emerald-400"
    if (value >= 70) return "text-teal-400"
    if (value >= 50) return "text-amber-400"
    if (value >= 30) return "text-orange-400"
    return "text-red-400"
  }

  const status = getSustainabilityStatus(displayScore)

  return (
    <div className="relative bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-green-500/20 border border-emerald-500/30 rounded-xl p-6 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/25">
            <Leaf className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Green Index Score</h3>
            <p className="text-sm text-muted-foreground">
              {todayScore !== undefined ? "Today's sustainability score" : "Based on current conditions"}
            </p>
          </div>
        </div>

        <div className="flex items-end gap-3 mb-6">
          <p className={`text-6xl font-bold ${getIndexColor(displayScore)}`}>
            <AnimatedCounter value={displayScore} />
          </p>
          <div className="pb-2">
            <p className="text-lg font-medium text-foreground">/100</p>
            <p className={`text-sm ${status.color}`}>{status.label}</p>
          </div>
        </div>

        {/* Progress ring visualization */}
        <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ${
              displayScore >= 85
                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                : displayScore >= 70
                  ? "bg-gradient-to-r from-teal-500 to-cyan-400"
                  : displayScore >= 50
                    ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                    : displayScore >= 30
                      ? "bg-gradient-to-r from-orange-500 to-amber-400"
                      : "bg-gradient-to-r from-red-500 to-orange-400"
            }`}
            style={{ width: `${displayScore}%` }}
          />
        </div>

        {progressPercent !== undefined && progressPercent > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>7-Day Average</span>
            </div>
            <span className={`font-semibold ${getIndexColor(progressPercent)}`}>{progressPercent}/100</span>
          </div>
        )}
      </div>
    </div>
  )
}
