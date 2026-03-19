"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2,
  Fan,
  Droplets,
  Sun,
  Car,
  Recycle,
  Lock,
  CheckCircle2,
  Calendar,
  Clock,
  ChevronLeft,
} from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { TestModeIndicator } from "@/components/test-mode-indicator"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import {
  getUser,
  getDailyInputs,
  addDailyInput,
  canSubmitToday,
  getEcoScore,
  updateEcoScore,
  getBadges,
  updateBadges,
  getTimeUntilNextEntry,
} from "@/lib/storage"
import { calculateEcoScore, checkBadges } from "@/lib/calculations"
import { IS_TEST_MODE } from "@/lib/config"
import type { User, DailyInput } from "@/lib/types"

export default function DailyInputPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [canSubmit, setCanSubmit] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pastInputs, setPastInputs] = useState<DailyInput[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)

  const [acFanHours, setAcFanHours] = useState(4)
  const [waterUsage, setWaterUsage] = useState(100)
  const [outdoorExposure, setOutdoorExposure] = useState<"low" | "medium" | "high">("medium")
  const [transportMode, setTransportMode] = useState<"walk" | "cycle" | "public" | "private">("public")
  const [wasteSegregation, setWasteSegregation] = useState(true)

  useEffect(() => {
    const fetchIt = async () => {
      const currentUser = await getUser()
      if (!currentUser) {
        router.push("/")
        return
      }
      setUser(currentUser)

      const checkSubmitStatus = async () => {
        const canSubmitNow = await canSubmitToday(currentUser.id)
        setCanSubmit(canSubmitNow)
        if (!canSubmitNow) {
          setTimeRemaining(await getTimeUntilNextEntry(currentUser.id))
        }
      }

      await checkSubmitStatus()

      const allInputs = await getDailyInputs()
      const userInputs = allInputs
        .filter((i) => i.userId === currentUser.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      setPastInputs(userInputs)

      setLoading(false)

      const interval = setInterval(() => {
        checkSubmitStatus()
      }, 1000)

      return () => clearInterval(interval)
    }
    fetchIt()
  }, [router, submitted])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !canSubmit) return

    setSubmitting(true)

    const input: DailyInput = {
      id: crypto.randomUUID(),
      userId: user.id,
      date: new Date().toISOString().split("T")[0],
      acFanHours,
      waterUsage,
      outdoorExposure,
      transportMode,
      wasteSegregation,
      timestamp: new Date().toISOString(),
      locked: true,
    }

    addDailyInput(input)

    const currentScore = await getEcoScore()
    const newScore = calculateEcoScore(input, currentScore)
    await updateEcoScore(newScore)

    const allInputs = [...(await getDailyInputs()).filter((i) => i.userId === user.id), input]
    const badges = await getBadges()
    const updatedBadges = checkBadges(allInputs, badges)
    await updateBadges(updatedBadges)

    await new Promise((resolve) => setTimeout(resolve, 500))

    setSubmitting(false)
    setSubmitted(true)
    setCanSubmit(false)
    setPastInputs([input, ...pastInputs])
  }

  const viewPastInput = (input: DailyInput) => {
    setSelectedDate(input.date)
    setAcFanHours(input.acFanHours)
    setWaterUsage(input.waterUsage)
    setOutdoorExposure(input.outdoorExposure)
    setTransportMode(input.transportMode)
    setWasteSegregation(input.wasteSegregation)
  }

  const clearSelection = () => {
    setSelectedDate(null)
    setAcFanHours(4)
    setWaterUsage(100)
    setOutdoorExposure("medium")
    setTransportMode("public")
    setWasteSegregation(true)
  }

  const formatTimeRemaining = (ms: number) => {
    if (ms <= 0) return "Now"
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    }
    return `${seconds}s`
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  const isViewingPast = selectedDate !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      <FloatingParticles />
      <Header />
      <TestModeIndicator />

      <main className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Daily Input</h1>
          <p className="text-muted-foreground">Log your daily sustainability behaviors to track your impact.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {submitted && !isViewingPast ? (
              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Entry Submitted!</h2>
                <p className="text-muted-foreground mb-4">
                  Your daily input has been recorded.{" "}
                  {IS_TEST_MODE ? "Next entry unlocks in 1 minute." : "Check back tomorrow for your next entry."}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>Entry is now locked</span>
                </div>
                {timeRemaining > 0 && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-sm text-emerald-400">
                    <Clock className="h-4 w-4" />
                    <span>Next entry unlocks in: {formatTimeRemaining(timeRemaining)}</span>
                  </div>
                )}
              </div>
            ) : !canSubmit && !isViewingPast ? (
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Entry Already Submitted</h2>
                <p className="text-muted-foreground mb-4">
                  You&apos;ve already submitted your daily input.{" "}
                  {IS_TEST_MODE ? "Wait for the timer." : "Come back tomorrow!"}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
                  <Clock className="h-4 w-4" />
                  <span>Next entry unlocks in: {formatTimeRemaining(timeRemaining)}</span>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {isViewingPast && (
                  <div className="flex items-center justify-between p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-400" />
                      <span className="text-foreground font-medium">
                        Viewing entry from {new Date(selectedDate).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={clearSelection}>
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back to today
                    </Button>
                  </div>
                )}

                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-amber-500/20 rounded-lg">
                      <Fan className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">AC/Fan Usage</Label>
                      <p className="text-sm text-muted-foreground">How many hours did you use AC or fan today?</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[acFanHours]}
                      onValueChange={(v) => setAcFanHours(v[0])}
                      max={24}
                      step={1}
                      disabled={isViewingPast}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0 hours</span>
                      <span className="text-lg font-bold text-foreground">{acFanHours} hours</span>
                      <span>24 hours</span>
                    </div>
                    {acFanHours > 4 && !isViewingPast && (
                      <p className="text-xs text-amber-400">Tip: Baseline is 4 hours. You&apos;re above baseline.</p>
                    )}
                  </div>
                </div>

                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Droplets className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Water Usage</Label>
                      <p className="text-sm text-muted-foreground">Estimated water consumption in liters</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Slider
                      value={[waterUsage]}
                      onValueChange={(v) => setWaterUsage(v[0])}
                      max={300}
                      step={5}
                      disabled={isViewingPast}
                      className="py-4"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0 L</span>
                      <span className="text-lg font-bold text-foreground">{waterUsage} liters</span>
                      <span>300 L</span>
                    </div>
                    {waterUsage > 100 && !isViewingPast && (
                      <p className="text-xs text-blue-400">Tip: Baseline is 100L. Try to conserve water.</p>
                    )}
                  </div>
                </div>

                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-500/20 rounded-lg">
                      <Sun className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Outdoor Exposure</Label>
                      <p className="text-sm text-muted-foreground">Time spent outdoors today</p>
                    </div>
                  </div>
                  <RadioGroup
                    value={outdoorExposure}
                    onValueChange={(v) => setOutdoorExposure(v as "low" | "medium" | "high")}
                    className="flex flex-wrap gap-4"
                    disabled={isViewingPast}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="text-foreground cursor-pointer">
                        Low (&lt;1 hour)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="text-foreground cursor-pointer">
                        Medium (1-3 hours)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="text-foreground cursor-pointer">
                        High (&gt;3 hours)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/20 rounded-lg">
                      <Car className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <Label className="text-foreground font-medium">Primary Transport</Label>
                      <p className="text-sm text-muted-foreground">Main mode of transportation today</p>
                    </div>
                  </div>
                  <RadioGroup
                    value={transportMode}
                    onValueChange={(v) => setTransportMode(v as "walk" | "cycle" | "public" | "private")}
                    className="grid grid-cols-2 gap-4"
                    disabled={isViewingPast}
                  >
                    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                      <RadioGroupItem value="walk" id="walk" />
                      <Label htmlFor="walk" className="text-foreground cursor-pointer">
                        Walking
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                      <RadioGroupItem value="cycle" id="cycle" />
                      <Label htmlFor="cycle" className="text-foreground cursor-pointer">
                        Cycling
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                      <RadioGroupItem value="public" id="public" />
                      <Label htmlFor="public" className="text-foreground cursor-pointer">
                        Public Transport
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-lg">
                      <RadioGroupItem value="private" id="private" />
                      <Label htmlFor="private" className="text-foreground cursor-pointer">
                        Private Vehicle
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-teal-500/20 rounded-lg">
                        <Recycle className="h-5 w-5 text-teal-400" />
                      </div>
                      <div>
                        <Label className="text-foreground font-medium">Waste Segregation</Label>
                        <p className="text-sm text-muted-foreground">Did you segregate waste today?</p>
                      </div>
                    </div>
                    <Switch checked={wasteSegregation} onCheckedChange={setWasteSegregation} disabled={isViewingPast} />
                  </div>
                </div>

                {!isViewingPast && (
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Daily Entry"
                    )}
                  </Button>
                )}
              </form>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-4">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                Past Entries
              </h3>
              {pastInputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No past entries yet. Submit your first entry!</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pastInputs.map((input) => (
                    <button
                      key={input.id}
                      onClick={() => viewPastInput(input)}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedDate === input.date
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {new Date(input.date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </span>
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{input.acFanHours}h AC</span>
                        <span>|</span>
                        <span>{input.waterUsage}L</span>
                        <span>|</span>
                        <span>{input.transportMode}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
