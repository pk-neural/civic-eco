import type { WeatherData, ForecastDay } from "./types"

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org"
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1"
const OPENWEATHER_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ""
const OPENWEATHER_BASE = "https://api.openweathermap.org/data/2.5"

const apiCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

function getCachedData<T>(key: string): T | null {
  const cached = apiCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data as T
  }
  return null
}

function setCachedData(key: string, data: any): void {
  apiCache.set(key, { data, timestamp: Date.now() })
}

/** Indian CPCB AQI breakpoints for a given pollutant concentration */
function linearInterp(c: number, cLow: number, cHigh: number, iLow: number, iHigh: number): number {
  return ((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow
}

function aqiForPM25(c: number): number {
  if (c <= 0)   return 0
  if (c <= 30)  return linearInterp(c,   0,  30,   0,  50)
  if (c <= 60)  return linearInterp(c,  31,  60,  51, 100)
  if (c <= 90)  return linearInterp(c,  61,  90, 101, 200)
  if (c <= 120) return linearInterp(c,  91, 120, 201, 300)
  if (c <= 250) return linearInterp(c, 121, 250, 301, 400)
  return Math.min(500, linearInterp(c, 251, 500, 401, 500))
}

function aqiForPM10(c: number): number {
  if (c <= 0)   return 0
  if (c <= 50)  return linearInterp(c,   0,  50,   0,  50)
  if (c <= 100) return linearInterp(c,  51, 100,  51, 100)
  if (c <= 250) return linearInterp(c, 101, 250, 101, 200)
  if (c <= 350) return linearInterp(c, 251, 350, 201, 300)
  if (c <= 430) return linearInterp(c, 351, 430, 301, 400)
  return Math.min(500, linearInterp(c, 431, 600, 401, 500))
}

function aqiForNO2(c: number): number {
  // µg/m³
  if (c <= 0)   return 0
  if (c <= 40)  return linearInterp(c,   0,  40,   0,  50)
  if (c <= 80)  return linearInterp(c,  41,  80,  51, 100)
  if (c <= 180) return linearInterp(c,  81, 180, 101, 200)
  if (c <= 280) return linearInterp(c, 181, 280, 201, 300)
  if (c <= 400) return linearInterp(c, 281, 400, 301, 400)
  return Math.min(500, linearInterp(c, 401, 600, 401, 500))
}

function aqiForSO2(c: number): number {
  // µg/m³
  if (c <= 0)   return 0
  if (c <= 40)  return linearInterp(c,   0,  40,   0,  50)
  if (c <= 80)  return linearInterp(c,  41,  80,  51, 100)
  if (c <= 380) return linearInterp(c,  81, 380, 101, 200)
  if (c <= 800) return linearInterp(c, 381, 800, 201, 300)
  if (c <= 1600)return linearInterp(c, 801, 1600, 301, 400)
  return Math.min(500, linearInterp(c, 1601, 2100, 401, 500))
}

function aqiForO3(c: number): number {
  // µg/m³
  if (c <= 0)   return 0
  if (c <= 50)  return linearInterp(c,   0,  50,   0,  50)
  if (c <= 100) return linearInterp(c,  51, 100,  51, 100)
  if (c <= 168) return linearInterp(c, 101, 168, 101, 200)
  if (c <= 208) return linearInterp(c, 169, 208, 201, 300)
  if (c <= 748) return linearInterp(c, 209, 748, 301, 400)
  return Math.min(500, 400)
}

function aqiForCO(c: number): number {
  // mg/m³ (OpenWeather gives µg/m³ for CO, divide by 1000)
  const cmg = c / 1000
  if (cmg <= 0)    return 0
  if (cmg <= 1.0)  return linearInterp(cmg, 0,  1.0,   0,  50)
  if (cmg <= 2.0)  return linearInterp(cmg, 1.1, 2.0,  51, 100)
  if (cmg <= 10.0) return linearInterp(cmg, 2.1, 10.0, 101, 200)
  if (cmg <= 17.0) return linearInterp(cmg, 10.1, 17.0, 201, 300)
  if (cmg <= 34.0) return linearInterp(cmg, 17.1, 34.0, 301, 400)
  return Math.min(500, 400)
}

/**
 * Calculate Indian AQI from all available pollutants (CPCB max-AQI standard).
 * Each pollutant is independently converted; the highest sub-index is the AQI.
 */
function calculateIndianAQI(components: {
  pm2_5: number; pm10: number; no2: number; so2: number; o3: number; co: number
}): number {
  const sub = [
    aqiForPM25(components.pm2_5),
    aqiForPM10(components.pm10),
    aqiForNO2(components.no2),
    aqiForSO2(components.so2),
    aqiForO3(components.o3),
    aqiForCO(components.co),
  ]
  return Math.round(Math.max(...sub))
}


export async function searchCities(
  query: string,
): Promise<Array<{ name: string; state: string; lat: number; lon: number }>> {
  if (!query || query.length < 2) return []

  const cacheKey = `search_${query.toLowerCase()}`
  const cached = getCachedData<Array<{ name: string; state: string; lat: number; lon: number }>>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(
      `${NOMINATIM_BASE}/search?q=${encodeURIComponent(query)}&countrycodes=in&format=json&addressdetails=1&limit=5`,
      { headers: { "User-Agent": "EcoPulse/1.0" } },
    )
    const data = await response.json()

    const results = data
      .filter((item: any) => item.address?.city || item.address?.town || item.address?.village || item.address?.state)
      .map((item: any) => ({
        name: item.address?.city || item.address?.town || item.address?.village || item.name,
        state: item.address?.state || "",
        lat: Number.parseFloat(item.lat),
        lon: Number.parseFloat(item.lon),
      }))

    setCachedData(cacheKey, results)
    return results
  } catch (error) {
    console.error("City search failed:", error)
    return []
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<{ name: string; state: string } | null> {
  const cacheKey = `reverse_${lat.toFixed(2)}_${lon.toFixed(2)}`
  const cached = getCachedData<{ name: string; state: string }>(cacheKey)
  if (cached) return cached

  try {
    const response = await fetch(`${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`, {
      headers: { "User-Agent": "EcoPulse/1.0" },
    })
    const data = await response.json()

    if (data.address?.country_code !== "in") {
      return null
    }

    const result = {
      name: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "",
      state: data.address?.state || "",
    }

    setCachedData(cacheKey, result)
    return result
  } catch (error) {
    console.error("Reverse geocode failed:", error)
    return null
  }
}

export async function getWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const cacheKey = `weather_${lat.toFixed(3)}_${lon.toFixed(3)}`
  const cached = getCachedData<WeatherData>(cacheKey)
  if (cached) return cached

  try {
    // Fetch weather and air pollution data in parallel
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(`${OPENWEATHER_BASE}/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`),
      fetch(`${OPENWEATHER_BASE}/air_pollution?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}`),
    ])

    if (weatherResponse.ok && aqiResponse.ok) {
      const weatherData = await weatherResponse.json()
      const aqiData = await aqiResponse.json()

      const aqiComponents = aqiData.list?.[0]?.components || {}
      const aqi = calculateIndianAQI({
        pm2_5: aqiComponents.pm2_5 || 0,
        pm10:  aqiComponents.pm10  || 0,
        no2:   aqiComponents.no2   || 0,
        so2:   aqiComponents.so2   || 0,
        o3:    aqiComponents.o3    || 0,
        co:    aqiComponents.co    || 0,
      })

      // Estimate UV from cloud cover (simplified)
      const clouds = weatherData.clouds?.all || 0
      const uvIndex = Math.max(1, Math.round(10 - clouds / 10))

      const result: WeatherData = {
        temperature: Math.round(weatherData.main?.temp || 30),
        humidity: weatherData.main?.humidity || 60,
        windSpeed: Math.round((weatherData.wind?.speed || 0) * 3.6), // m/s to km/h
        uvIndex,
        aqi,
        condition: getWeatherConditionFromCode(weatherData.weather?.[0]?.id || 800),
      }

      setCachedData(cacheKey, result)
      return result
    }

    // Fallback to Open-Meteo if OpenWeather fails
    return await getWeatherDataFromOpenMeteo(lat, lon)
  } catch (error) {
    console.error("Weather fetch failed, using Open-Meteo fallback:", error)
    return await getWeatherDataFromOpenMeteo(lat, lon)
  }
}

async function getWeatherDataFromOpenMeteo(lat: number, lon: number): Promise<WeatherData> {
  try {
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(
        `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,uv_index,weather_code&timezone=auto`,
      ),
      fetch(`${OPEN_METEO_BASE}/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5`),
    ])

    const data = await weatherResponse.json()
    const aqiData = await aqiResponse.json()

    const pm25      = aqiData.current?.pm2_5 || 0
    // Open-Meteo air quality supports additional pollutants
    const pm10      = (aqiData.current as any)?.pm10  || pm25 * 1.7
    const no2       = (aqiData.current as any)?.nitrogen_dioxide || 30
    const so2       = (aqiData.current as any)?.sulphur_dioxide  || 15
    const o3        = (aqiData.current as any)?.ozone            || 40
    const co        = (aqiData.current as any)?.carbon_monoxide  || 800
    const aqi = calculateIndianAQI({ pm2_5: pm25, pm10, no2, so2, o3, co })

    return {
      temperature: data.current?.temperature_2m || 0,
      humidity: data.current?.relative_humidity_2m || 0,
      windSpeed: data.current?.wind_speed_10m || 0,
      uvIndex: data.current?.uv_index || 0,
      aqi,
      condition: getWeatherCondition(data.current?.weather_code || 0),
    }
  } catch (error) {
    console.error("Open-Meteo fetch failed:", error)
    return { temperature: 30, humidity: 60, windSpeed: 10, uvIndex: 5, aqi: 50, condition: "Clear" }
  }
}

function getWeatherConditionFromCode(code: number): string {
  if (code >= 200 && code < 300) return "Stormy"
  if (code >= 300 && code < 400) return "Rainy"
  if (code >= 500 && code < 600) return "Rainy"
  if (code >= 600 && code < 700) return "Snowy"
  if (code >= 700 && code < 800) return "Foggy"
  if (code === 800) return "Clear"
  if (code > 800) return "Partly Cloudy"
  return "Clear"
}

export async function getForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const cacheKey = `forecast_${lat.toFixed(3)}_${lon.toFixed(3)}`
  const cached = getCachedData<ForecastDay[]>(cacheKey)
  if (cached) return cached

  try {
    const [weatherResponse, aqiResponse] = await Promise.all([
      fetch(
        `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&timezone=auto&forecast_days=7`,
      ),
      fetch(`${OPEN_METEO_BASE}/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5&forecast_days=7`),
    ])

    const data = await weatherResponse.json()
    const aqiData = await aqiResponse.json()

    const dailyAqi: number[] = []
    if (aqiData.hourly?.pm2_5) {
      for (let i = 0; i < 7; i++) {
        const dayPm25Values = aqiData.hourly.pm2_5.slice(i * 24, (i + 1) * 24)
        const avgPm25 = dayPm25Values.reduce((a: number, b: number) => a + b, 0) / dayPm25Values.length
        // Use PM2.5 as primary; estimate other pollutants proportionally as fallback
        dailyAqi.push(calculateIndianAQI({
          pm2_5: avgPm25,
          pm10:  avgPm25 * 1.7,
          no2:   30,
          so2:   15,
          o3:    40,
          co:    800,
        }))
      }
    }

    const results =
      data.daily?.time?.map((date: string, i: number) => ({
        date,
        tempMax: data.daily.temperature_2m_max[i],
        tempMin: data.daily.temperature_2m_min[i],
        rainProbability: data.daily.precipitation_probability_max[i] || 0,
        aqi: dailyAqi[i] || 50,
        condition: getWeatherCondition(data.daily.weather_code[i]),
      })) || []

    setCachedData(cacheKey, results)
    return results
  } catch (error) {
    console.error("Forecast fetch failed:", error)
    return []
  }
}

function getWeatherCondition(code: number): string {
  if (code === 0) return "Clear"
  if (code <= 3) return "Partly Cloudy"
  if (code <= 49) return "Foggy"
  if (code <= 69) return "Rainy"
  if (code <= 79) return "Snowy"
  if (code <= 99) return "Stormy"
  return "Clear"
}
