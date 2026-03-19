"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Leaf, Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CitySearch } from "./city-search"
import { loginOrSignup } from "@/lib/storage"
import type { User } from "@/lib/types"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [city, setCity] = useState<{ name: string; state: string; lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    if (!city) {
      setError("Please select your city")
      return
    }

    setLoading(true)

    const success = await loginOrSignup({
      email,
      password,
      city: city.name,
      state: city.state,
      lat: city.lat,
      lon: city.lon,
    })

    setLoading(false)

    if (success) {
      router.push("/dashboard")
    } else {
      setError("Login failed. Check your password or try again.")
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Glassmorphism Card */}
      <div className="relative bg-background/40 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-50" />

        <div className="relative z-10">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-4 shadow-lg shadow-emerald-500/25">
              <Leaf className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoPulse
            </h1>
            <p className="text-muted-foreground mt-2">Green Technology Intelligence Platform</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-background/50 border-white/20 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground/80">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-background/50 border-white/20 focus:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-foreground/80">Select Your City (India)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Search and select your city. All dashboards will use this location.
              </p>
              <CitySearch onSelect={setCity} selected={city ? { name: city.name, state: city.state } : null} />
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl hover:shadow-emerald-500/30"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">Your gateway to sustainable living</p>
        </div>
      </div>
    </div>
  )
}
