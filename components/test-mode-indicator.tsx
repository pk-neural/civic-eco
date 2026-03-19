"use client"

import { Settings } from "lucide-react"
import { IS_TEST_MODE } from "@/lib/config"

export function TestModeIndicator() {
  if (!IS_TEST_MODE) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg backdrop-blur-sm">
      <Settings className="h-4 w-4 text-amber-400 animate-spin" style={{ animationDuration: "3s" }} />
      <span className="text-xs text-amber-400 font-medium">Test Mode Active (1-Minute Cycle)</span>
    </div>
  )
}
