"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Leaf, Target, Users, Globe, Award, Lightbulb, Heart } from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { getUser } from "@/lib/storage"
import type { User } from "@/lib/types"

export default function AboutPage() {
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

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
            <Leaf className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            EcoPulse
          </h1>
          <p className="text-xl text-muted-foreground">Green Technology Intelligence Platform</p>
        </div>

        {/* Mission */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Target className="h-6 w-6 text-emerald-400" />
            <h2 className="text-2xl font-bold text-foreground">Our Mission</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            EcoPulse is designed to empower Indian citizens to track, measure, and improve their environmental impact.
            By combining real-time weather data, personalized sustainability metrics, and gamified rewards, we aim to
            make eco-conscious living accessible, engaging, and impactful for everyone.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="p-3 bg-blue-500/20 rounded-lg w-fit mb-4">
              <Globe className="h-6 w-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Real-Time Data</h3>
            <p className="text-sm text-muted-foreground">
              Live weather, AQI, and environmental data powered by Open-Meteo API, covering all of India.
            </p>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="p-3 bg-amber-500/20 rounded-lg w-fit mb-4">
              <Award className="h-6 w-6 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Gamified Rewards</h3>
            <p className="text-sm text-muted-foreground">
              Earn badges, eco credits, and compete for prizes while making sustainable choices daily.
            </p>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="p-3 bg-emerald-500/20 rounded-lg w-fit mb-4">
              <Lightbulb className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Smart Recommendations</h3>
            <p className="text-sm text-muted-foreground">
              4R-based waste management guidance with actionable tips tailored to your inputs.
            </p>
          </div>

          <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
            <div className="p-3 bg-purple-500/20 rounded-lg w-fit mb-4">
              <Users className="h-6 w-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Community Impact</h3>
            <p className="text-sm text-muted-foreground">
              Track city-level contributions to water saving, energy reduction, and CO2 avoidance.
            </p>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Technology Stack</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Next.js 15",
              "React 19",
              "TypeScript",
              "Tailwind CSS",
              "Recharts",
              "Leaflet.js",
              "OpenStreetMap",
              "Open-Meteo API",
              "Nominatim Geocoding",
            ].map((tech) => (
              <span key={tech} className="px-3 py-1 bg-white/10 rounded-full text-sm text-foreground">
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t border-white/10">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-4 w-4 text-red-400 fill-red-400" />
            <span>for a greener India</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">No AI. Only logic, data, and behavior change.</p>
        </div>
      </main>
    </div>
  )
}
