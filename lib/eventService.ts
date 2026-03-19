/**
 * Environmental Events Service — lib/eventService.ts
 * Returns hardcoded calendar of major environmental events.
 * Provides the next upcoming event within 60 days.
 */

export interface EnvironmentalEvent {
  id:           string
  name:         string
  date:         string        // "MM-DD" format
  description:  string
  icon:         string        // emoji
  theme:        string        // short tag
  color:        string        // Tailwind class for gradient
}

// Major environmental events (MM-DD)
export const ENVIRONMENTAL_EVENTS: EnvironmentalEvent[] = [
  {
    id: "world-wetlands",
    name: "World Wetlands Day",
    date: "02-02",
    description: "Wetlands are Earth's kidneys — vital for water purification, flood control, and biodiversity.",
    icon: "🦢",
    theme: "Wetlands & Water",
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "world-water",
    name: "World Water Day",
    date: "03-22",
    description: "Celebrating the importance of freshwater and advocating for sustainable management of water resources.",
    icon: "💧",
    theme: "Water Conservation",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    id: "earth-hour",
    name: "Earth Hour",
    date: "03-25",
    description: "Switch off lights for one hour to show your commitment to the planet and raise awareness about climate change.",
    icon: "🕯️",
    theme: "Energy Awareness",
    color: "from-amber-500/20 to-yellow-500/20",
  },
  {
    id: "earth-day",
    name: "Earth Day",
    date: "04-22",
    description: "The world's largest environmental movement, celebrating our planet and raising awareness about environmental protection.",
    icon: "🌍",
    theme: "Planet Protection",
    color: "from-emerald-500/20 to-green-500/20",
  },
  {
    id: "biodiversity",
    name: "International Biodiversity Day",
    date: "05-22",
    description: "Recognizing biodiversity as the foundation of life on Earth — from forests and oceans to urban ecosystems.",
    icon: "🦋",
    theme: "Biodiversity",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "cycling-day",
    name: "World Bicycle Day",
    date: "06-03",
    description: "Promoting cycling as a sustainable transport mode that reduces carbon emissions and improves public health.",
    icon: "🚲",
    theme: "Sustainable Transport",
    color: "from-teal-500/20 to-emerald-500/20",
  },
  {
    id: "environment-day",
    name: "World Environment Day",
    date: "06-05",
    description: "The principal UN vehicle for encouraging awareness and action for the protection of our environment worldwide.",
    icon: "🌿",
    theme: "Environmental Action",
    color: "from-green-500/20 to-teal-500/20",
  },
  {
    id: "oceans-day",
    name: "World Oceans Day",
    date: "06-08",
    description: "Raising global awareness about the ocean's critical role in supporting human life and the need to protect it.",
    icon: "🌊",
    theme: "Ocean Health",
    color: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "ozone-day",
    name: "World Ozone Day",
    date: "09-16",
    description: "Commemorating the signing of the Montreal Protocol and celebrating progress in healing the ozone layer.",
    icon: "☀️",
    theme: "Ozone Layer",
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    id: "rivers-day",
    name: "World Rivers Day",
    date: "09-22",
    description: "Celebrating the world's waterways and raising awareness about conservation of rivers worldwide.",
    icon: "🏞️",
    theme: "River Conservation",
    color: "from-cyan-500/20 to-blue-500/20",
  },
  {
    id: "habitat-day",
    name: "World Habitat Day",
    date: "10-06",
    description: "Reflecting on the state of our towns and cities and the basic right of all to adequate shelter.",
    icon: "🏡",
    theme: "Sustainable Cities",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "climate-action",
    name: "Global Climate Action Day",
    date: "09-20",
    description: "A worldwide call to action on climate change — marches, protests and community events across the globe.",
    icon: "✊",
    theme: "Climate Action",
    color: "from-red-500/20 to-orange-500/20",
  },
  {
    id: "anti-pollution",
    name: "National Pollution Control Day",
    date: "12-02",
    description: "Observed in India to raise awareness about preventing pollution and managing industries sustainably.",
    icon: "🏭",
    theme: "Pollution Control",
    color: "from-slate-500/20 to-gray-500/20",
  },
  {
    id: "air-quality",
    name: "Clean Air Day",
    date: "09-07",
    description: "Raising global awareness about air quality and the damage that air pollution causes to health and the environment.",
    icon: "💨",
    theme: "Air Quality",
    color: "from-sky-500/20 to-teal-500/20",
  },
]

export interface UpcomingEvent extends EnvironmentalEvent {
  daysUntil:   number
  isToday:     boolean
  fullDate:    Date
}

export function getUpcomingEvent(withinDays = 60): UpcomingEvent | null {
  const today = new Date()
  const year  = today.getFullYear()

  let closest: UpcomingEvent | null = null

  for (const event of ENVIRONMENTAL_EVENTS) {
    const [month, day] = event.date.split("-").map(Number)

    // Try this year and next year
    for (const y of [year, year + 1]) {
      const eventDate = new Date(y, month - 1, day)
      const diffMs = eventDate.getTime() - today.setHours(0, 0, 0, 0)
      const daysUntil = Math.floor(diffMs / 86400000)

      if (daysUntil >= 0 && daysUntil <= withinDays) {
        if (!closest || daysUntil < closest.daysUntil) {
          closest = {
            ...event,
            daysUntil,
            isToday:  daysUntil === 0,
            fullDate: eventDate,
          }
        }
      }
    }
  }

  return closest
}

export function getTodayEvent(): EnvironmentalEvent | null {
  const today  = new Date()
  const month  = String(today.getMonth() + 1).padStart(2, "0")
  const day    = String(today.getDate()).padStart(2, "0")
  const key    = `${month}-${day}`
  return ENVIRONMENTAL_EVENTS.find((e) => e.date === key) || null
}
