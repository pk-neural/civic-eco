import type { ChatMessage } from "@/lib/types"

interface AssistantContext {
  city?: string
  aqi?: number
  aqiCategory?: string
  temperature?: number
  humidity?: number
  windSpeed?: number
  condition?: string
  ecoScore?: number
}

/**
 * Sends a chat message to the EcoPulse AI assistant.
 * Optionally includes the user's current environmental context for personalized responses.
 */
export async function sendChatMessage(
  message: string,
  history: ChatMessage[],
  context?: AssistantContext
): Promise<string> {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history, context }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error("Chat API error:", err)
      return "I'm having trouble connecting right now. Please check that the EcoPulse backend is running. 🔌"
    }

    const data = await response.json()
    return data.response as string
  } catch (err) {
    console.error("AI assistant error:", err)
    return "I'm temporarily unavailable. Please ensure the backend is running at localhost:8000. 🔌"
  }
}

/** Suggested quick-start questions shown to the user. */
export const SUGGESTED_QUESTIONS = [
  "Is it safe to go outside today?",
  "What does PM2.5 mean?",
  "How can I reduce my carbon footprint?",
  "Why is pollution high today?",
  "What is AQI and how is it measured?",
  "How do I reduce energy consumption at home?",
]
