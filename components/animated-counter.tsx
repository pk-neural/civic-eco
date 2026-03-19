"use client"

import { useEffect, useState } from "react"

interface AnimatedCounterProps {
  value: number
  duration?: number
  suffix?: string
  decimals?: number
}

export function AnimatedCounter({ value, duration = 1000, suffix = "", decimals = 0 }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const current = startValue + (value - startValue) * easeOutQuart

      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span>
      {displayValue.toFixed(decimals)}
      {suffix}
    </span>
  )
}
