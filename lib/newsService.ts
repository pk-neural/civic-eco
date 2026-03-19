/**
 * Environmental News Service — lib/newsService.ts
 * Fetches climate/pollution news from GNews API.
 * Falls back to curated static articles if API is unavailable.
 */

export interface NewsArticle {
  id:          string
  title:       string
  description: string
  url:         string
  image:       string
  source:      string
  publishedAt: string
}

const GNEWS_API_KEY = process.env.NEXT_PUBLIC_GNEWS_API_KEY || ""
const GNEWS_BASE    = "https://gnews.io/api/v4"

// Static fallback articles
const STATIC_ARTICLES: NewsArticle[] = [
  {
    id: "1",
    title: "India's Air Quality Crisis: Cities Battle Rising Pollution Levels",
    description: "Major Indian cities are witnessing severe air quality deterioration as PM2.5 levels soar, prompting authorities to implement emergency measures and urging residents to limit outdoor activities.",
    url: "https://www.downtoearth.org.in/pollution/air",
    image: "https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=400&q=80",
    source: "Down To Earth",
    publishedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: "2",
    title: "Climate Change Accelerates: UN Report Warns of Irreversible Damage",
    description: "The United Nations Intergovernmental Panel on Climate Change releases its latest assessment warning that without immediate action, global temperatures could surpass the critical 1.5°C threshold within a decade.",
    url: "https://www.unep.org/news-and-stories/story/climate-change",
    image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80",
    source: "UNEP",
    publishedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "3",
    title: "Green Energy Revolution: India Hits Record Solar Power Generation",
    description: "India surpasses its renewable energy targets with record solar power generation, making significant strides towards its ambitious net-zero goals and reducing dependency on fossil fuels.",
    url: "https://economictimes.indiatimes.com/industry/energy/power",
    image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&q=80",
    source: "Economic Times",
    publishedAt: new Date(Date.now() - 8 * 3600000).toISOString(),
  },
  {
    id: "4",
    title: "Ocean Pollution: Microplastics Found in Remote Himalayan Lakes",
    description: "Scientists have discovered alarming concentrations of microplastics in pristine Himalayan mountain lakes, highlighting the pervasive reach of plastic pollution even in the most remote ecosystems.",
    url: "https://www.nature.com/subjects/environmental-sciences",
    image: "https://images.unsplash.com/photo-1531956656798-56686eeef3d4?w=400&q=80",
    source: "Nature",
    publishedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "5",
    title: "Monsoon Patterns Shift: Heavy Rainfall Events Increase Across South Asia",
    description: "Climate scientists report a significant change in monsoon patterns across South Asia, with more frequent extreme rainfall events and longer dry spells between rains, affecting agriculture and water security.",
    url: "https://www.downtoearth.org.in/weather",
    image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80",
    source: "Down To Earth",
    publishedAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: "6",
    title: "Urban Trees: Cities Plant Millions to Combat Heat Islands",
    description: "A growing number of Indian cities are embracing large-scale urban forestry initiatives, planting millions of trees to mitigate urban heat island effects, improve air quality, and enhance biodiversity.",
    url: "https://www.thehindu.com/sci-tech/energy-and-environment",
    image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=400&q=80",
    source: "The Hindu",
    publishedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
]

export async function fetchEnvironmentalNews(count = 6): Promise<NewsArticle[]> {
  if (!GNEWS_API_KEY) {
    return STATIC_ARTICLES.slice(0, count)
  }

  try {
    const query = encodeURIComponent("climate OR pollution OR environment OR weather India")
    const url = `${GNEWS_BASE}/search?q=${query}&lang=en&country=in&max=${count}&apikey=${GNEWS_API_KEY}`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })

    if (!res.ok) throw new Error(`GNews API error: ${res.status}`)

    const data = await res.json()
    const articles: NewsArticle[] = (data.articles || []).map((a: any, i: number) => ({
      id:          String(i + 1),
      title:       a.title || "Environmental Update",
      description: a.description || "",
      url:         a.url || "#",
      image:       a.image || STATIC_ARTICLES[i % STATIC_ARTICLES.length].image,
      source:      a.source?.name || "News",
      publishedAt: a.publishedAt || new Date().toISOString(),
    }))

    return articles.length > 0 ? articles : STATIC_ARTICLES.slice(0, count)
  } catch {
    return STATIC_ARTICLES.slice(0, count)
  }
}

export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}
