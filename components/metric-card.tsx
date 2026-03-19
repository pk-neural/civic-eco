"use client"

import type { LucideIcon } from "lucide-react"
import { AnimatedCounter } from "./animated-counter"

interface MetricCardProps {
  title: string
  value: number
  suffix?: string
  icon: LucideIcon
  color: "emerald" | "blue" | "amber" | "red" | "purple"
  description?: string
  showProgress?: boolean
}

const colorClasses = {
  emerald: {
    bg: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/30",
    icon: "bg-emerald-500/20 text-emerald-400",
    progress: "bg-emerald-500",
    glow: "shadow-emerald-500/20",
  },
  blue: {
    bg: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    icon: "bg-blue-500/20 text-blue-400",
    progress: "bg-blue-500",
    glow: "shadow-blue-500/20",
  },
  amber: {
    bg: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    icon: "bg-amber-500/20 text-amber-400",
    progress: "bg-amber-500",
    glow: "shadow-amber-500/20",
  },
  red: {
    bg: "from-red-500/20 to-red-600/10",
    border: "border-red-500/30",
    icon: "bg-red-500/20 text-red-400",
    progress: "bg-red-500",
    glow: "shadow-red-500/20",
  },
  purple: {
    bg: "from-purple-500/20 to-purple-600/10",
    border: "border-purple-500/30",
    icon: "bg-purple-500/20 text-purple-400",
    progress: "bg-purple-500",
    glow: "shadow-purple-500/20",
  },
}

export function MetricCard({
  title,
  value,
  suffix = "",
  icon: Icon,
  color,
  description,
  showProgress,
}: MetricCardProps) {
  const classes = colorClasses[color]

  return (
    <div
      className={`relative bg-gradient-to-br ${classes.bg} border ${classes.border} rounded-xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${classes.glow}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${classes.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-bold text-foreground">
          <AnimatedCounter value={value} suffix={suffix} />
        </p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {showProgress && (
        <div className="mt-4">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full ${classes.progress} rounded-full transition-all duration-1000`}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
