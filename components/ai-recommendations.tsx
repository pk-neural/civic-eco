"use client"

import { Sparkles, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Recommendation } from "@/lib/types"
import { priorityToStyle } from "@/lib/ai/recommendationEngine"

interface AIRecommendationsProps {
  recommendations: Recommendation[]
  loading?: boolean
  onRefresh?: () => void
  compact?: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  air:       "Air Quality",
  energy:    "Energy",
  transport: "Transport",
  water:     "Water",
  waste:     "Waste",
}

export function AIRecommendations({
  recommendations,
  loading = false,
  onRefresh,
  compact = false,
}: AIRecommendationsProps) {
  const displayed = compact ? recommendations.slice(0, 3) : recommendations

  return (
    <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Smart Recommendations</h3>
            <p className="text-xs text-muted-foreground">AI · personalized to your conditions</p>
          </div>
        </div>
        {onRefresh && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        )}
      </div>

      {/* Recommendations List */}
      <div className="px-4 pb-5 space-y-2">
        {loading ? (
          Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))
        ) : displayed.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No recommendations available.</p>
        ) : (
          displayed.map((rec, i) => {
            const { dot, border } = priorityToStyle(rec.priority)
            return (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg bg-white/5 border ${border} transition-all hover:bg-white/10`}
              >
                {/* Icon */}
                <span className="text-xl shrink-0 mt-0.5" role="img" aria-label={rec.category}>
                  {rec.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-medium text-sm text-foreground">{rec.title}</span>
                    {/* Priority dot */}
                    <span className={`w-1.5 h-1.5 rounded-full ${dot} shrink-0`} title={rec.priority} />
                    {/* Category badge */}
                    <span className="text-xs text-muted-foreground bg-white/10 rounded px-1.5 py-0.5">
                      {CATEGORY_LABELS[rec.category] ?? rec.category}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{rec.description}</p>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
