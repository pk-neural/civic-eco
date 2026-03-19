"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, Recycle, Trash2, Leaf, AlertTriangle, CheckCircle2, XCircle,
  HelpCircle, ArrowRight, ArrowLeft, Smartphone, Package, Apple, Skull, Layers,
  TrendingUp, TrendingDown, Minus, MapPin, Building,
} from "lucide-react"
import { Header } from "@/components/header"
import { FloatingParticles } from "@/components/particles"
import { Button } from "@/components/ui/button"
import { getUser, getEcoScore, getDailyInputs, addWasteDecision } from "@/lib/storage"
import {
  WASTE_QUESTIONS, getWasteRecommendation,
  type WasteCategory, type WasteAnswers, type WasteRecommendation,
} from "@/lib/wasteDecisionEngine"
import type { User, EcoScore } from "@/lib/types"

const wasteTypes = [
  { id: "e-waste",   label: "E-Waste",       icon: Smartphone, description: "Electronics, batteries, cables",     color: "blue" },
  { id: "dry",       label: "Dry Waste",      icon: Package,    description: "Paper, plastic, cardboard",         color: "amber" },
  { id: "wet",       label: "Wet Waste",      icon: Apple,      description: "Food scraps, organic matter",       color: "green" },
  { id: "hazardous", label: "Hazardous",      icon: Skull,      description: "Chemicals, medicines, paints",      color: "red" },
  { id: "mixed",     label: "Mixed Waste",    icon: Layers,     description: "Unsegregated / multi-type waste",   color: "purple" },
] as const

const COLOR_MAP: Record<string, string> = {
  blue:   "text-blue-400 bg-blue-500/20 border-blue-500/50",
  amber:  "text-amber-400 bg-amber-500/20 border-amber-500/50",
  green:  "text-emerald-400 bg-emerald-500/20 border-emerald-500/50",
  red:    "text-red-400 bg-red-500/20 border-red-500/50",
  purple: "text-purple-400 bg-purple-500/20 border-purple-500/50",
}

export default function TacklePollutionPage() {
  const router = useRouter()
  const [user,     setUser]     = useState<User | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [ecoScore, setEcoScore] = useState<EcoScore | null>(null)

  // Stepper state
  const [selectedWaste,  setSelectedWaste]  = useState<WasteCategory | null>(null)
  const [questionIndex,  setQuestionIndex]  = useState(0)
  const [answers,        setAnswers]        = useState<WasteAnswers>({})
  const [recommendation, setRecommendation] = useState<WasteRecommendation | null>(null)

  useEffect(() => {
    const fetchPollution = async () => {
      const currentUser = await getUser()
      if (!currentUser) { router.push("/"); return }
      setUser(currentUser)
      setEcoScore(await getEcoScore())
      setLoading(false)
    }
    fetchPollution()
  }, [router])

  const questions     = selectedWaste ? WASTE_QUESTIONS[selectedWaste] : []
  const currentQ      = questions[questionIndex]
  const progress      = selectedWaste ? ((questionIndex) / questions.length) * 100 : 0

  const selectAnswer  = async (optionId: string) => {
    if (!currentQ) return
    const newAnswers = { ...answers, [currentQ.id]: optionId }
    setAnswers(newAnswers)

    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1)
    } else {
      // All answered — get recommendation
      const rec = getWasteRecommendation(selectedWaste!, newAnswers)
      setRecommendation(rec)
      await addWasteDecision({
        type:         selectedWaste!,
        action:       rec.action,
        whatToDo:     rec.whatToDo,
        whatToAvoid:  rec.whatToAvoid,
        whyItMatters: rec.whyItMatters,
        ecoCredits:   rec.ecoCredits,
      })
    }
  }

  const reset = () => {
    setSelectedWaste(null)
    setQuestionIndex(0)
    setAnswers({})
    setRecommendation(null)
  }

  const goBack = () => {
    if (questionIndex > 0) {
      setQuestionIndex((i) => i - 1)
    } else {
      reset()
    }
  }

  const ecoSummary = (() => {
    if (!ecoScore) return { net: 0, status: "neutral" as "neutral" | "credit" | "debt" }
    const total = ecoScore.waterCredit + ecoScore.energyCredit + ecoScore.transportCredit + ecoScore.wasteCredit
    const net = total - ecoScore.debt
    return { net, status: net > 0 ? "credit" as const : net < 0 ? "debt" as const : "neutral" as const }
  })()

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
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Recycle className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Tackle Pollution</h1>
          </div>
          <p className="text-muted-foreground">
            Dynamic waste guidance — different decisions for different waste types.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── Main Decision Panel ─────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">

              {/* ── STEP 1: Select Waste Type ── */}
              {!selectedWaste && !recommendation && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-teal-500/20 rounded-lg">
                      <Trash2 className="h-5 w-5 text-teal-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Smart Waste Decision Engine</h2>
                      <p className="text-sm text-muted-foreground">Step 1 of 3 — Select your waste type</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {wasteTypes.map((w) => {
                      const colorCls = COLOR_MAP[w.color] || ""
                      return (
                        <button
                          key={w.id}
                          onClick={() => { setSelectedWaste(w.id as WasteCategory); setQuestionIndex(0); setAnswers({}) }}
                          className={`p-4 rounded-xl border bg-white/5 hover:border-white/30 transition-all text-left group`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${colorCls.split(" ").slice(1).join(" ")} group-hover:opacity-90 transition-opacity`}>
                              <w.icon className={`h-5 w-5 ${colorCls.split(" ")[0]}`} />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{w.label}</p>
                              <p className="text-xs text-muted-foreground">{w.description}</p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {/* ── STEP 2: Category-specific Questions ── */}
              {selectedWaste && !recommendation && currentQ && (
                <>
                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <button onClick={goBack} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <span className="text-sm font-medium text-foreground">
                          Question {questionIndex + 1} / {questions.length}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{selectedWaste.replace("-", " ")} Waste</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-6">{currentQ.question}</h2>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {currentQ.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => selectAnswer(opt.id)}
                        className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all text-left"
                      >
                        {opt.icon && <span className="text-2xl flex-shrink-0">{opt.icon}</span>}
                        <span className="font-medium text-foreground">{opt.label}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* ── STEP 3: Recommendation ── */}
              {recommendation && (
                <div className="space-y-6">
                  {/* Action Badge */}
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                    <p className="text-sm text-muted-foreground mb-2">Recommended Action</p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <span className="text-3xl">{recommendation.actionIcon}</span>
                      <span className={`inline-block px-5 py-2 rounded-full text-xl font-bold uppercase ${recommendation.actionColor}`}>
                        {recommendation.action}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-400 font-medium mt-2">+{recommendation.ecoCredits} Eco Credits Earned!</p>
                  </div>

                  {/* What To Do / Avoid */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                        <h3 className="font-semibold text-foreground">What To Do</h3>
                      </div>
                      <ul className="space-y-2">
                        {recommendation.whatToDo.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-400 mt-1 flex-shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <XCircle className="h-5 w-5 text-red-400" />
                        <h3 className="font-semibold text-foreground">What To Avoid</h3>
                      </div>
                      <ul className="space-y-2">
                        {recommendation.whatToAvoid.map((item, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-red-400 mt-1 flex-shrink-0">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Why It Matters */}
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <HelpCircle className="h-5 w-5 text-blue-400" />
                      <h3 className="font-semibold text-foreground">Why It Matters</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{recommendation.whyItMatters}</p>
                  </div>

                  {/* Facilities */}
                  {recommendation.facilities.length > 0 && (
                    <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <MapPin className="h-5 w-5 text-teal-400" />
                        <h3 className="font-semibold text-foreground">Where To Dispose</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recommendation.facilities.map((f, i) => (
                          <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400">
                            <Building className="h-3 w-3" />
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button onClick={reset} variant="outline" className="w-full bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Make Another Decision
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* ─── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Eco Score */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Leaf className="h-5 w-5 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-foreground">Unified Eco Score</h3>
              </div>
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2">
                  {ecoSummary.status === "credit" ? (
                    <TrendingUp className="h-6 w-6 text-emerald-400" />
                  ) : ecoSummary.status === "debt" ? (
                    <TrendingDown className="h-6 w-6 text-red-400" />
                  ) : (
                    <Minus className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className={`text-4xl font-bold ${
                    ecoSummary.status === "credit" ? "text-emerald-400" : ecoSummary.status === "debt" ? "text-red-400" : "text-foreground"
                  }`}>
                    {ecoSummary.net > 0 ? "+" : ""}{ecoSummary.net}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {ecoSummary.status === "credit" ? "Eco Credit" : ecoSummary.status === "debt" ? "Eco Debt" : "Neutral"}
                </p>
              </div>
              {ecoScore && (
                <div className="space-y-2 pt-4 border-t border-white/10 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Water Credit</span><span className="text-blue-400">+{ecoScore.waterCredit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Energy Credit</span><span className="text-amber-400">+{ecoScore.energyCredit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Transport Credit</span><span className="text-purple-400">+{ecoScore.transportCredit}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Waste Credit</span><span className="text-emerald-400">+{ecoScore.wasteCredit}</span></div>
                  <div className="flex justify-between pt-2 border-t border-white/10"><span className="text-muted-foreground">Eco Debt</span><span className="text-red-400">-{ecoScore.debt}</span></div>
                </div>
              )}
            </div>

            {/* Repay Debt */}
            {ecoScore && ecoScore.debt > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h3 className="font-semibold text-foreground">Repay Your Eco Debt</h3>
                </div>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {["Reduce AC usage by 1 hour tomorrow", "Use public transport instead of private", "Segregate waste properly for a week", "Take shorter showers to save water"].map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <span className="text-amber-400 mt-1">•</span>{tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4R Guide */}
            <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-4">4R Waste Hierarchy</h3>
              <div className="space-y-3">
                {[
                  { n: "1", label: "Reduce",   sub: "Minimize waste generation",   color: "blue" },
                  { n: "2", label: "Reuse",    sub: "Give items a second life",    color: "emerald" },
                  { n: "3", label: "Recycle",  sub: "Convert to new materials",    color: "amber" },
                  { n: "4", label: "Recover",  sub: "Extract energy/resources",   color: "purple" },
                ].map(({ n, label, sub, color }) => (
                  <div key={n} className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full bg-${color}-500/20 flex items-center justify-center text-sm font-bold text-${color}-400 flex-shrink-0`}>
                      {n}
                    </span>
                    <div>
                      <p className="font-medium text-foreground text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
