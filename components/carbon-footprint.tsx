"use client"

import { useState, useEffect } from "react"
import { Car, Bus, Bike, Footprints, Zap, Droplets, Wind, Trash2, Leaf, TrendingDown } from "lucide-react"
import { calculateCarbon, getCarbonTips, type CarbonInputs } from "@/lib/predictions/carbonCalculator"
import { Slider } from "@/components/ui/slider"

const defaultInputs: CarbonInputs = {
  carKm:          0,
  busKm:          0,
  bikeKm:         0,
  walkKm:         0,
  acHours:        4,
  electricityKwh: 5,
  waterLiters:    120,
  wasteKg:        0.5,
}

function co2Color(total: number) {
  if (total < 5)  return "text-emerald-400"
  if (total < 12) return "text-amber-400"
  return "text-red-400"
}

function co2BgColor(total: number) {
  if (total < 5)  return "from-emerald-500/10 to-teal-500/10 border-emerald-500/30"
  if (total < 12) return "from-amber-500/10 to-orange-500/10 border-amber-500/30"
  return "from-red-500/10 to-rose-500/10 border-red-500/30"
}

function SliderRow({
  icon: Icon,
  label,
  value,
  onChange,
  max,
  unit,
  color = "emerald",
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number
  onChange: (v: number) => void
  max: number
  unit: string
  color?: string
}) {
  const colorClass = {
    emerald: "text-emerald-400",
    amber:   "text-amber-400",
    blue:    "text-blue-400",
    orange:  "text-orange-400",
    purple:  "text-purple-400",
  }[color] || "text-emerald-400"

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorClass}`} />
          <span className="text-sm text-foreground">{label}</span>
        </div>
        <span className="text-sm font-medium text-foreground tabular-nums">
          {value} {unit}
        </span>
      </div>
      <Slider
        min={0}
        max={max}
        step={max > 50 ? 5 : 1}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  )
}

export function CarbonFootprint() {
  const [inputs, setInputs] = useState<CarbonInputs>(defaultInputs)
  const [expanded, setExpanded] = useState(false)

  const breakdown = calculateCarbon(inputs)
  const tips      = getCarbonTips(breakdown)

  const set = (key: keyof CarbonInputs) => (v: number) =>
    setInputs((prev) => ({ ...prev, [key]: v }))

  const barPct  = (val: number) => Math.min(100, (val / Math.max(breakdown.total, 1)) * 100)

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Leaf className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Carbon Footprint Calculator</h2>
            <p className="text-xs text-muted-foreground">Estimate your daily CO₂ emissions</p>
          </div>
        </div>
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
        >
          {expanded ? "Collapse" : "Expand"}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Transport</p>
          <SliderRow icon={Car}       label="Car travel"    value={inputs.carKm}   onChange={set("carKm")}   max={100} unit="km"   color="orange" />
          <SliderRow icon={Bus}       label="Bus travel"    value={inputs.busKm}   onChange={set("busKm")}   max={60}  unit="km"   color="blue" />
          <SliderRow icon={Bike}      label="Cycling"       value={inputs.bikeKm}  onChange={set("bikeKm")}  max={30}  unit="km"   color="emerald" />
          <SliderRow icon={Footprints}label="Walking"       value={inputs.walkKm}  onChange={set("walkKm")}  max={20}  unit="km"   color="emerald" />

          {expanded && (
            <>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-2">Home & Utilities</p>
              <SliderRow icon={Zap}     label="AC usage"        value={inputs.acHours}        onChange={set("acHours")}        max={14}  unit="hrs"  color="amber" />
              <SliderRow icon={Zap}     label="Electricity"     value={inputs.electricityKwh} onChange={set("electricityKwh")} max={30}  unit="kWh"  color="amber" />
              <SliderRow icon={Droplets}label="Water usage"     value={inputs.waterLiters}    onChange={set("waterLiters")}    max={400} unit="L"    color="blue" />
              <SliderRow icon={Trash2}  label="Waste generated" value={inputs.wasteKg}        onChange={set("wasteKg")}        max={5}   unit="kg"   color="purple" />
            </>
          )}

          {!expanded && (
            <button
              onClick={() => setExpanded(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              + Show home & utility inputs
            </button>
          )}
        </div>

        {/* Results */}
        <div className="space-y-4">
          {/* Total */}
          <div className={`rounded-xl border bg-gradient-to-br ${co2BgColor(breakdown.total)} p-5 text-center`}>
            <p className="text-xs text-muted-foreground mb-1">Today&apos;s Carbon Footprint</p>
            <p className={`text-4xl font-bold ${co2Color(breakdown.total)}`}>
              {breakdown.total}
              <span className="text-xl ml-1">kg CO₂</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">Weekly: <span className="font-medium text-foreground">{breakdown.weeklyTotal} kg CO₂</span></p>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Breakdown</p>
            {[
              { label: "Transport",   value: breakdown.transport,   color: "bg-orange-400" },
              { label: "AC",          value: breakdown.ac,          color: "bg-amber-400" },
              { label: "Electricity", value: breakdown.electricity, color: "bg-yellow-400" },
              { label: "Water",       value: breakdown.water,       color: "bg-blue-400" },
              { label: "Waste",       value: breakdown.waste,       color: "bg-purple-400" },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium text-foreground">{value} kg</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${barPct(value)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-400" /> Reduction Tips
            </p>
            {tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg border border-white/10">
                <span className="text-base flex-shrink-0">{tip.icon}</span>
                <div>
                  <p className="text-xs text-foreground leading-snug">{tip.tip}</p>
                  <p className="text-xs text-emerald-400 mt-0.5">{tip.saving}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
