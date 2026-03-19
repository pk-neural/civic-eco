"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Map, Info } from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { IndiaMap } from "@/components/india-map"
import { getUser } from "@/lib/storage"
import type { User } from "@/lib/types"

export default function HeatmapPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Map className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">India Heatmap</h1>
          </div>
          <p className="text-muted-foreground">
            Explore real-time environmental data across India. Hover over any location to view live weather and air
            quality.
          </p>
        </div>

        {/* Info Card */}
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-foreground font-medium">Interactive Map</p>
            <p className="text-xs text-muted-foreground mt-1">
              Move your mouse over the map to see real-time temperature, AQI, and humidity data for any location in
              India. The data is fetched live from weather APIs.
            </p>
          </div>
        </div>

        {/* Map */}
        <IndiaMap />

        {/* Additional Info */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl">
            <h3 className="font-medium text-foreground mb-2">Temperature Stress</h3>
            <p className="text-sm text-muted-foreground">
              High temperatures increase energy demand and heat stress. Areas with 35°C+ face significant sustainability
              challenges.
            </p>
          </div>
          <div className="p-4 bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl">
            <h3 className="font-medium text-foreground mb-2">Air Quality Index</h3>
            <p className="text-sm text-muted-foreground">
              AQI measures air pollution levels. Values above 100 are considered unhealthy, especially for sensitive
              groups.
            </p>
          </div>
          <div className="p-4 bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl">
            <h3 className="font-medium text-foreground mb-2">Water Stress</h3>
            <p className="text-sm text-muted-foreground">
              Low humidity indicates dry conditions requiring water conservation. Monitor your local conditions and
              adjust usage.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
