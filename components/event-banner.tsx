"use client"

import { useEffect, useState } from "react"
import { X, Wind, Thermometer, CloudRain, Calendar, ChevronRight } from "lucide-react"
import { getUpcomingEvent, type UpcomingEvent } from "@/lib/eventService"

export function EventBanner() {
  const [event,     setEvent]     = useState<UpcomingEvent | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const upcoming = getUpcomingEvent(60)
    setEvent(upcoming)
  }, [])

  if (!event || dismissed) return null

  // Mock forecast data for this event day
  const mockForecast = {
    aqi:     event.isToday ? 145 : 118,
    aqiLabel:event.isToday ? "Moderate" : "Satisfactory",
    temp:    event.isToday ? 32 : 29,
    rainPct: event.isToday ? 25 : 40,
  }

  return (
    <>
      {/* Banner */}
      <div
        className={`relative rounded-xl border overflow-hidden bg-gradient-to-r ${event.color.replace("from-", "from-").replace("to-", "to-")} border-white/20 p-4 cursor-pointer group hover:border-white/30 transition-all duration-200`}
        onClick={() => setModalOpen(true)}
      >
        <button
          onClick={(e) => { e.stopPropagation(); setDismissed(true) }}
          className="absolute top-3 right-3 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-3xl">
            {event.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {event.isToday ? "🎉 Today!" : `In ${event.daysUntil} day${event.daysUntil !== 1 ? "s" : ""}`}
              </span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {event.fullDate.toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
              </span>
            </div>
            <h3 className="font-bold text-foreground text-base leading-tight">{event.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{event.description}</p>
          </div>

          {/* CTA */}
          <div className="flex-shrink-0 flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            <span className="hidden sm:block">View Forecast</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-slate-900/95 border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{event.icon}</span>
                <div>
                  <h2 className="font-bold text-foreground text-lg leading-tight">{event.name}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.fullDate.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{event.description}</p>

            {/* Environmental Forecast for Event Day */}
            <div className="space-y-3 mb-4">
              <h3 className="text-sm font-semibold text-foreground">Environmental Forecast</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <Wind className="h-4 w-4 text-emerald-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-foreground">{mockForecast.aqi}</p>
                  <p className="text-xs text-emerald-400">{mockForecast.aqiLabel}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">AQI</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <Thermometer className="h-4 w-4 text-orange-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-foreground">{mockForecast.temp}°C</p>
                  <p className="text-xs text-orange-400">
                    {mockForecast.temp > 35 ? "Hot" : mockForecast.temp > 28 ? "Warm" : "Pleasant"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Temp</p>
                </div>
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-center">
                  <CloudRain className="h-4 w-4 text-blue-400 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-foreground">{mockForecast.rainPct}%</p>
                  <p className="text-xs text-blue-400">
                    {mockForecast.rainPct > 60 ? "Likely" : mockForecast.rainPct > 30 ? "Possible" : "Low Chance"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">Rain</p>
                </div>
              </div>
            </div>

            {/* Theme tag */}
            <div className="flex items-center justify-between">
              <span className="text-xs px-3 py-1 rounded-full bg-white/10 border border-white/20 text-muted-foreground">
                🏷️ {event.theme}
              </span>
              {event.isToday && (
                <span className="text-xs text-emerald-400 font-medium">
                  🌟 Take action today!
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
