"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { Loader2, Thermometer, Wind, Droplets, MapPin, Sun, Zap, Leaf } from "lucide-react"

declare global {
  interface Window {
    L: any
  }
}

// Major Indian cities with baseline AQI estimates for pre-loading markers
const MAJOR_CITIES = [
  { name: "Delhi",     lat: 28.61, lon: 77.21, baseAQI: 180 },
  { name: "Mumbai",    lat: 19.08, lon: 72.88, baseAQI: 95  },
  { name: "Kolkata",   lat: 22.57, lon: 88.36, baseAQI: 140 },
  { name: "Chennai",   lat: 13.08, lon: 80.27, baseAQI: 80  },
  { name: "Bangalore", lat: 12.97, lon: 77.59, baseAQI: 70  },
  { name: "Hyderabad", lat: 17.38, lon: 78.49, baseAQI: 90  },
  { name: "Ahmedabad", lat: 23.03, lon: 72.55, baseAQI: 130 },
  { name: "Pune",      lat: 18.52, lon: 73.85, baseAQI: 85  },
  { name: "Jaipur",    lat: 26.91, lon: 75.79, baseAQI: 155 },
  { name: "Lucknow",   lat: 26.85, lon: 80.95, baseAQI: 195 },
  { name: "Kanpur",    lat: 26.44, lon: 80.33, baseAQI: 210 },
  { name: "Nagpur",    lat: 21.14, lon: 79.08, baseAQI: 100 },
  { name: "Surat",     lat: 21.17, lon: 72.83, baseAQI: 110 },
  { name: "Patna",     lat: 25.59, lon: 85.14, baseAQI: 230 },
  { name: "Bhopal",    lat: 23.25, lon: 77.41, baseAQI: 90  },
  { name: "Indore",    lat: 22.72, lon: 75.86, baseAQI: 105 },
  { name: "Varanasi",  lat: 25.32, lon: 83.00,  baseAQI: 200 },
  { name: "Coimbatore",lat: 11.00, lon: 76.96, baseAQI: 65  },
  { name: "Kochi",     lat: 9.94,  lon: 76.26, baseAQI: 55  },
  { name: "Guwahati",  lat: 26.14, lon: 91.74, baseAQI: 75  },
]

function getAQIMarkerColor(aqi: number): { fill: string; ring: string } {
  if (aqi <= 50)  return { fill: "#10b981", ring: "#10b981" } // Good - emerald
  if (aqi <= 100) return { fill: "#84cc16", ring: "#84cc16" } // Satisfactory - lime
  if (aqi <= 200) return { fill: "#f59e0b", ring: "#f59e0b" } // Moderate - amber
  if (aqi <= 300) return { fill: "#f97316", ring: "#f97316" } // Poor - orange
  if (aqi <= 400) return { fill: "#ef4444", ring: "#ef4444" } // Very Poor - red
  return           { fill: "#991b1b", ring: "#991b1b" }        // Severe - dark red
}

interface HoverData {
  city: string
  state: string
  lat: number
  lon: number
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
  aqi: number
  pm25: number
  pm10: number
  greenIndex: number
  greenExplanation: string
  x: number
  y: number
}

const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""

const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function calculateIndianAQI(pm25: number): number {
  // Indian CPCB AQI breakpoints for PM2.5
  const breakpoints = [
    { cLow: 0, cHigh: 30, iLow: 0, iHigh: 50 }, // Good
    { cLow: 31, cHigh: 60, iLow: 51, iHigh: 100 }, // Satisfactory
    { cLow: 61, cHigh: 90, iLow: 101, iHigh: 200 }, // Moderate
    { cLow: 91, cHigh: 120, iLow: 201, iHigh: 300 }, // Poor
    { cLow: 121, cHigh: 250, iLow: 301, iHigh: 400 }, // Very Poor
    { cLow: 251, cHigh: 500, iLow: 401, iHigh: 500 }, // Severe
  ]

  if (pm25 <= 0) return 0
  if (pm25 > 500) return 500

  for (const bp of breakpoints) {
    if (pm25 >= bp.cLow && pm25 <= bp.cHigh) {
      const aqi = ((bp.iHigh - bp.iLow) / (bp.cHigh - bp.cLow)) * (pm25 - bp.cLow) + bp.iLow
      return Math.round(aqi)
    }
  }

  return Math.round(pm25)
}

function calculateGreenIndex(data: {
  temperature: number
  humidity: number
  windSpeed: number
  uvIndex: number
  aqi: number
}): { score: number; explanation: string } {
  const factors: string[] = []

  // AQI Score (40% weight) - Using Indian AQI scale
  let aqiScore = 100
  if (data.aqi > 400) {
    aqiScore = 0
    factors.push("Severe air pollution")
  } else if (data.aqi > 300) {
    aqiScore = 10
    factors.push("Very poor air quality")
  } else if (data.aqi > 200) {
    aqiScore = 25
    factors.push("Poor air quality")
  } else if (data.aqi > 100) {
    aqiScore = 50
    factors.push("Moderate air quality")
  } else if (data.aqi > 50) {
    aqiScore = 75
    factors.push("Satisfactory air")
  }

  // Temperature Score (20% weight) - Comfort range: 20-28°C
  let tempScore = 100
  if (data.temperature > 40) {
    tempScore = 20
    factors.push("Extreme heat")
  } else if (data.temperature > 35) {
    tempScore = 40
    factors.push("High heat stress")
  } else if (data.temperature > 30) {
    tempScore = 60
    factors.push("Moderate heat")
  } else if (data.temperature < 10) {
    tempScore = 60
    factors.push("Cold stress")
  } else if (data.temperature >= 20 && data.temperature <= 28) {
    tempScore = 100
  } else {
    tempScore = 80
  }

  // Wind Score (15% weight) - Good ventilation helps air quality
  let windScore = 70
  if (data.windSpeed > 20) {
    windScore = 90
    factors.push("Good ventilation")
  } else if (data.windSpeed > 10) {
    windScore = 80
  } else if (data.windSpeed < 5 && data.aqi > 100) {
    windScore = 40
    factors.push("Stagnant + polluted")
  }

  // UV Score (15% weight) - Solar potential vs skin risk
  let uvScore = 80
  if (data.uvIndex > 10) {
    uvScore = 50
    factors.push("Extreme UV")
  } else if (data.uvIndex > 7) {
    uvScore = 70
    factors.push("High UV")
  } else if (data.uvIndex >= 3 && data.uvIndex <= 6) {
    uvScore = 100
  }

  // Humidity Score (10% weight)
  let humidityScore = 80
  if (data.humidity < 25) {
    humidityScore = 50
    factors.push("Water stress")
  } else if (data.humidity > 85) {
    humidityScore = 60
    factors.push("High humidity")
  } else if (data.humidity >= 40 && data.humidity <= 70) {
    humidityScore = 100
  }

  // Weighted calculation
  let score = Math.round(aqiScore * 0.4 + tempScore * 0.2 + windScore * 0.15 + uvScore * 0.15 + humidityScore * 0.1)

  if (data.aqi > 150 && score > 60) {
    score = Math.min(score, 60)
    if (!factors.includes("Poor air quality") && !factors.includes("Very poor air quality")) {
      factors.unshift("Air quality concern")
    }
  }

  const explanation = factors.length > 0 ? factors.slice(0, 3).join(" | ") : "Optimal conditions"

  return { score: Math.max(0, Math.min(100, score)), explanation }
}

async function fetchWeatherData(lat: number, lon: number) {
  const cacheKey = `weather_${lat.toFixed(2)}_${lon.toFixed(2)}`
  const cached = apiCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const [weatherRes, airRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`,
      ),
      fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`),
    ])

    const weatherData = await weatherRes.json()
    const airData = await airRes.json()

    const pm25 = airData.list?.[0]?.components?.pm2_5 || 0
    const pm10 = airData.list?.[0]?.components?.pm10 || 0

    const aqi = calculateIndianAQI(pm25)

    // Estimate UV from cloud cover and time (simplified)
    const clouds = weatherData.clouds?.all || 0
    const uvIndex = Math.max(1, Math.round(10 - clouds / 10))

    const result = {
      temperature: Math.round(weatherData.main?.temp || 25),
      humidity: weatherData.main?.humidity || 50,
      windSpeed: Math.round((weatherData.wind?.speed || 0) * 3.6),
      uvIndex,
      aqi,
      pm25: Math.round(pm25),
      pm10: Math.round(pm10),
    }

    apiCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch (error) {
    console.error("Weather API error:", error)
    return {
      temperature: 28,
      humidity: 60,
      windSpeed: 12,
      uvIndex: 6,
      aqi: 75,
      pm25: 25,
      pm10: 45,
    }
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<{ city: string; state: string }> {
  const cacheKey = `geo_${lat.toFixed(2)}_${lon.toFixed(2)}`
  const cached = apiCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&countrycodes=in`,
      { headers: { "Accept-Language": "en", "User-Agent": "EcoPulse/1.0" } },
    )
    const data = await res.json()

    const result = {
      city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "Unknown",
      state: data.address?.state || "India",
    }

    apiCache.set(cacheKey, { data: result, timestamp: Date.now() })
    return result
  } catch {
    return { city: "Unknown", state: "India" }
  }
}

export function IndiaMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  const lastFetchRef = useRef<number>(0)
  const lastLatRef = useRef<number>(0)
  const lastLngRef = useRef<number>(0)
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const rafRef = useRef<number | null>(null)

  const [hoverData, setHoverData] = useState<HoverData | null>(null)
  const [fetching, setFetching] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    if (window.L) {
      initializeMap()
      return
    }

    // Load Leaflet CSS
    const linkEl = document.createElement("link")
    linkEl.rel = "stylesheet"
    linkEl.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(linkEl)

    // Load Leaflet JS
    const scriptEl = document.createElement("script")
    scriptEl.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    scriptEl.onload = () => {
      const heatScript = document.createElement("script")
      heatScript.src = "https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"
      heatScript.onload = () => initializeMap()
      document.head.appendChild(heatScript)
    }
    document.head.appendChild(scriptEl)

    return () => {
      if (throttleTimeoutRef.current) clearTimeout(throttleTimeoutRef.current)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  const initializeMap = () => {
    if (!mapContainerRef.current || mapRef.current) return

    const L = window.L

    const map = L.map(mapContainerRef.current, {
      center: [22.5, 82.5],
      zoom: 5,
      minZoom: 4,
      maxZoom: 10,
      maxBounds: [
        [6, 68],
        [38, 98],
      ],
      maxBoundsViscosity: 1.0,
      zoomAnimation: true,
      fadeAnimation: false,
      markerZoomAnimation: false,
    })

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      subdomains: "abcd",
    }).addTo(map)

    mapRef.current = map
    setMapReady(true)

    // Inject CSS for pulse animation (once)
    if (!document.getElementById("ecopulse-pulse-style")) {
      const style = document.createElement("style")
      style.id = "ecopulse-pulse-style"
      style.textContent = `
        @keyframes ecopulse-ring {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(3.5); opacity: 0; }
        }
        .ecopulse-pulse-ring {
          animation: ecopulse-ring 2s ease-out infinite;
          transform-origin: center;
        }
        .ecopulse-pulse-ring-2 {
          animation: ecopulse-ring 2s ease-out 0.8s infinite;
          transform-origin: center;
        }
      `
      document.head.appendChild(style)
    }

    // Add pre-loaded city markers with AQI-colour pulse rings
    MAJOR_CITIES.forEach((city) => {
      const { fill, ring } = getAQIMarkerColor(city.baseAQI)
      const svgIcon = L.divIcon({
        className: "",
        iconSize:  [24, 24],
        iconAnchor:[12, 12],
        html: `
          <svg width="24" height="24" viewBox="0 0 24 24" style="overflow:visible">
            <circle cx="12" cy="12" r="5" fill="${ring}" opacity="0.25" class="ecopulse-pulse-ring" />
            <circle cx="12" cy="12" r="5" fill="${ring}" opacity="0.18" class="ecopulse-pulse-ring-2" />
            <circle cx="12" cy="12" r="5" fill="${fill}" opacity="0.9" />
            <circle cx="12" cy="12" r="2.5" fill="white" opacity="0.9" />
          </svg>
        `,
      })

      L.marker([city.lat, city.lon], { icon: svgIcon, interactive: false })
        .addTo(map)
    })

    map.on("mousemove", handleMapHover)
    map.on("mouseout", handleMapLeave)
  }

  const handleMapHover = useCallback(
    (e: any) => {
      const { lat, lng } = e.latlng

      // Check bounds
      if (lat < 6 || lat > 38 || lng < 68 || lng > 98) {
        handleMapLeave()
        return
      }

      if (hoverData) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current)
        rafRef.current = requestAnimationFrame(() => {
          setHoverData((prev) => (prev ? { ...prev, x: e.containerPoint.x, y: e.containerPoint.y } : null))
        })
      }

      const now = Date.now()
      const timeDelta = now - lastFetchRef.current
      const latDelta = Math.abs(lat - lastLatRef.current)
      const lngDelta = Math.abs(lng - lastLngRef.current)
      const distanceMoved = latDelta > 0.3 || lngDelta > 0.3

      if (timeDelta < 500 && !distanceMoved) return
      if (fetching) return

      // Clear any pending throttle
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current)
      }

      throttleTimeoutRef.current = setTimeout(async () => {
        lastFetchRef.current = Date.now()
        lastLatRef.current = lat
        lastLngRef.current = lng

        setFetching(true)

        try {
          const [location, weather] = await Promise.all([reverseGeocode(lat, lng), fetchWeatherData(lat, lng)])

          const { score: greenIndex, explanation: greenExplanation } = calculateGreenIndex({
            temperature: weather.temperature,
            humidity: weather.humidity,
            windSpeed: weather.windSpeed,
            uvIndex: weather.uvIndex,
            aqi: weather.aqi,
          })

          setHoverData({
            city: location.city,
            state: location.state,
            lat,
            lon: lng,
            ...weather,
            greenIndex,
            greenExplanation,
            x: e.containerPoint.x,
            y: e.containerPoint.y,
          })

          updateHeatLayer(lat, lng, greenIndex)
        } catch (error) {
          console.error("Error fetching hover data:", error)
        } finally {
          setFetching(false)
        }
      }, 350)
    },
    [fetching, hoverData],
  )

  const handleMapLeave = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    setHoverData(null)

    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
  }, [])

  const updateHeatLayer = (lat: number, lon: number, greenIndex: number) => {
    const L = window.L
    if (!L || !mapRef.current) return

    // Clear existing heat layer first
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }

    // Green Index 75-100 = Low stress (0.4 intensity - green)
    // Green Index 50-74 = Medium stress (0.7 intensity - yellow)
    // Green Index 0-49 = High stress (1.0 intensity - red)
    let intensity: number
    if (greenIndex >= 75) {
      intensity = 0.4 // Low stress - green
    } else if (greenIndex >= 50) {
      intensity = 0.7 // Medium stress - yellow
    } else {
      intensity = 1.0 // High stress - red
    }

    const heatPoints: [number, number, number][] = [[lat, lon, intensity]]

    heatLayerRef.current = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 25,
      maxZoom: 7,
      gradient: {
        0.3: "#00ff9d", // Green - low stress
        0.6: "#ffd166", // Yellow - medium stress
        1.0: "#ef476f", // Red - high stress
      },
    }).addTo(mapRef.current)
  }

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "bg-emerald-500" // Good
    if (aqi <= 100) return "bg-green-400" // Satisfactory
    if (aqi <= 200) return "bg-amber-500" // Moderate
    if (aqi <= 300) return "bg-orange-500" // Poor
    if (aqi <= 400) return "bg-red-500" // Very Poor
    return "bg-red-700" // Severe
  }

  const getAQILabel = (aqi: number) => {
    if (aqi <= 50) return "Good"
    if (aqi <= 100) return "Satisfactory"
    if (aqi <= 200) return "Moderate"
    if (aqi <= 300) return "Poor"
    if (aqi <= 400) return "Very Poor"
    return "Severe"
  }

  const getGreenIndexColor = (score: number) => {
    if (score >= 75) return "text-emerald-400"
    if (score >= 50) return "text-teal-400"
    if (score >= 25) return "text-amber-400"
    return "text-red-400"
  }

  return (
    <div className="relative w-full h-[600px] rounded-xl overflow-hidden border border-white/20">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {!mapReady && (
        <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-20">
          <div className="flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            <span className="text-muted-foreground">Loading map...</span>
          </div>
        </div>
      )}

      {hoverData && (
        <div
          ref={popupRef}
          className="absolute z-50 pointer-events-none transition-none"
          style={{
            left: Math.min(hoverData.x + 15, (mapContainerRef.current?.clientWidth || 400) - 280),
            top: Math.max(hoverData.y - 280, 10),
            willChange: "left, top",
          }}
        >
          <div className="bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-2xl min-w-[260px]">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/10">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <div>
                <p className="font-semibold text-foreground">{hoverData.city}</p>
                <p className="text-xs text-muted-foreground">{hoverData.state}</p>
              </div>
            </div>

            <div className="mb-3 p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-medium text-foreground">Green Index</span>
                </div>
                <span className={`text-xl font-bold ${getGreenIndexColor(hoverData.greenIndex)}`}>
                  {hoverData.greenIndex}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{hoverData.greenExplanation}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-xs text-muted-foreground">Temp</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{hoverData.temperature}°C</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  <span className="text-xs text-muted-foreground">Humidity</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{hoverData.humidity}%</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Wind className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Wind</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{hoverData.windSpeed} km/h</span>
              </div>

              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <div className="flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">UV</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{hoverData.uvIndex}</span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between p-2 bg-white/5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-purple-400" />
                <span className="text-xs text-muted-foreground">AQI (India)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getAQIColor(hoverData.aqi)}`} />
                <span className="text-sm font-semibold text-foreground">
                  {hoverData.aqi} - {getAQILabel(hoverData.aqi)}
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>PM2.5: {hoverData.pm25} µg/m³</span>
              <span>PM10: {hoverData.pm10} µg/m³</span>
            </div>
          </div>
        </div>
      )}

      {fetching && (
        <div className="absolute top-4 right-4 z-50 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      <div className="absolute bottom-4 left-4 z-40 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl p-4">
        <p className="text-sm font-medium text-foreground mb-2">Environmental Stress</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#00ff9d" }} />
            <span className="text-muted-foreground">Low stress (Green Index 75+)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ffd166" }} />
            <span className="text-muted-foreground">Medium stress (50-74)</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef476f" }} />
            <span className="text-muted-foreground">High stress (0-49)</span>
          </div>
        </div>
      </div>

      <div className="absolute top-4 left-4 z-40 bg-background/95 backdrop-blur-xl border border-white/20 rounded-xl px-3 py-2">
        <p className="text-xs text-muted-foreground">Hover anywhere on the map to view real-time environmental data</p>
      </div>
    </div>
  )
}
