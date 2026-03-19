"use client"

import { useState, useEffect, useRef } from "react"
import { Search, MapPin, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { searchCities, reverseGeocode } from "@/lib/api"

interface CitySearchProps {
  onSelect: (city: { name: string; state: string; lat: number; lon: number }) => void
  selected?: { name: string; state: string } | null
}

export function CitySearch({ onSelect, selected }: CitySearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{ name: string; state: string; lat: number; lon: number }>>([])
  const [loading, setLoading] = useState(false)
  const [locating, setLocating] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState("")
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true)
        setError("")
        const cities = await searchCities(query)
        setResults(cities)
        setShowResults(true)
        setLoading(false)
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const handleUseLocation = async () => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser. Please search manually.")
      return
    }

    // Check if we're on a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      setError("Location access requires HTTPS. Please use the search instead.")
      return
    }

    setLocating(true)
    setError("")

    // W3C Geolocation API with proper options
    const geolocationOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // Cache position for 1 minute
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Reverse geocode to get city name
          const location = await reverseGeocode(latitude, longitude)

          if (location && location.name) {
            onSelect({ ...location, lat: latitude, lon: longitude })
            setError("")
          } else {
            setError("Could not detect an Indian city at your location. Please search manually.")
          }
        } catch (err) {
          console.error("Geocoding error:", err)
          setError("Failed to get location details. Please search manually.")
        } finally {
          setLocating(false)
        }
      },
      (positionError) => {
        setLocating(false)

        // Handle specific error codes
        switch (positionError.code) {
          case positionError.PERMISSION_DENIED:
            setError(
              "Location permission denied. Please enable location access in your browser settings or search manually.",
            )
            break
          case positionError.POSITION_UNAVAILABLE:
            setError("Location unavailable. Please ensure GPS is enabled or search manually.")
            break
          case positionError.TIMEOUT:
            setError("Location request timed out. Please try again or search manually.")
            break
          default:
            setError("Unable to retrieve your location. Please search manually.")
        }
      },
      geolocationOptions,
    )
  }

  return (
    <div ref={wrapperRef} className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search city in India..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-background/50 border-white/20 focus:border-emerald-500/50"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-emerald-500" />
        )}

        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background/95 backdrop-blur-lg border border-white/20 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {results.map((city, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-emerald-500/10 transition-colors flex items-center gap-2 border-b border-white/10 last:border-0"
                onClick={() => {
                  onSelect(city)
                  setQuery("")
                  setShowResults(false)
                  setError("")
                }}
              >
                <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-foreground">
                  {city.name}, {city.state}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/20" />
        <span className="text-xs text-muted-foreground uppercase">or</span>
        <div className="flex-1 h-px bg-white/20" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full bg-background/50 border-white/20 hover:bg-emerald-500/10 hover:border-emerald-500/50"
        onClick={handleUseLocation}
        disabled={locating}
      >
        {locating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Detecting location...
          </>
        ) : (
          <>
            <MapPin className="mr-2 h-4 w-4" />
            Use My Current Location
          </>
        )}
      </Button>

      {selected && (
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <MapPin className="h-4 w-4 text-emerald-500" />
          <span className="text-sm text-foreground">
            {selected.name}, {selected.state}
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  )
}
