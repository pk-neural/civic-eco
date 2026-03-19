"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Leaf, Gauge, Zap, Droplets, Car, Trash2 } from "lucide-react"
import type { AIEcoScore } from "@/lib/types"
import { ecoScoreToStyle } from "@/lib/ai/ecoScoreModel"

interface EcoImpactCardProps {
  ecoScore: AIEcoScore
  compact?: boolean
}

const BREAKDOWN_ICONS: Record<string, React.ElementType> = {
  water_score:     Droplets,
  energy_score:    Zap,
  transport_score: Car,
  waste_score:     Trash2,
  outdoor_score:   Leaf,
}

const BREAKDOWN_LABELS: Record<string, string> = {
  water_score:     "Water Usage",
  energy_score:    "Energy Usage",
  transport_score: "Transport Mode",
  waste_score:     "Waste Management",
  outdoor_score:   "Outdoor Activity",
}

const BREAKDOWN_MAX: Record<string, number> = {
  water_score:     20,
  energy_score:    25,
  transport_score: 25,
  waste_score:     15,
  outdoor_score:   10,
}

export function EcoImpactCard({ ecoScore, compact = false }: EcoImpactCardProps) {
  const [expanded, setExpanded] = useState(!compact)
  const style     = ecoScoreToStyle(ecoScore.category)
  const circumference = 2 * Math.PI * 36   // r=36
  const dashOffset    = circumference - (circumference * ecoScore.score) / 100

  return (
    <div className={`relative bg-gradient-to-br from-slate-900/80 to-slate-800/40 border ${style.border} rounded-xl overflow-hidden ${compact ? "p-4" : "p-6"}`}>
      {/* Animated background glow */}
      <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-5 pointer-events-none`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
            <Gauge className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI Eco-Impact Score</h3>
            <p className="text-xs text-muted-foreground">ML-powered lifestyle analysis</p>
          </div>
        </div>

        {/* Score Gauge */}
        <div className="flex items-center gap-6 mb-4">
          {/* SVG Radial Gauge */}
          <div className="relative w-24 h-24 shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 84 84">
              <circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
              <circle
                cx="42" cy="42" r="36" fill="none"
                stroke="url(#ecoGradient)" strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="transition-all duration-700"
              />
              <defs>
                <linearGradient id="ecoGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%"   stopColor={style.gradient.includes("emerald") ? "#10b981" : style.gradient.includes("amber") ? "#f59e0b" : "#ef4444"} />
                  <stop offset="100%" stopColor={style.gradient.includes("emerald") ? "#14b8a6" : style.gradient.includes("amber") ? "#eab308" : "#f97316"} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xl font-bold ${style.badge}`}>{ecoScore.score}</span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>

          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${style.badgeBg} ${style.badge} mb-2`}>
              {ecoScore.category}
            </span>
            <p className="text-sm text-muted-foreground leading-snug">
              {ecoScore.category === "Eco-Friendly"
                ? "Excellent habits! You're well below average impact."
                : ecoScore.category === "Moderate"
                ? "You're on track — a few changes can make a big difference."
                : "Your habits have significant environmental impact today."}
            </p>
          </div>
        </div>

        {/* Insight Pills */}
        {!compact && ecoScore.insights.length > 0 && (
          <div className="space-y-2 mb-4">
            {ecoScore.insights.slice(0, 3).map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-white/5 rounded-lg px-3 py-2">
                <span className="shrink-0 mt-0.5">•</span>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Expandable Breakdown */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          {expanded ? "Hide" : "Show"} breakdown
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {Object.entries(ecoScore.breakdown).map(([key, val]) => {
              const Icon  = BREAKDOWN_ICONS[key] ?? Leaf
              const label = BREAKDOWN_LABELS[key] ?? key
              const max   = BREAKDOWN_MAX[key] ?? 25
              const pct   = Math.round((val / max) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-3 w-3 ${style.badge}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                    <span className={`font-medium ${style.badge}`}>{val}/{max}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${style.gradient} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
