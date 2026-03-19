"use client"

import { useState, useRef, useEffect } from "react"
import { Bot, X, Send, Minimize2, Maximize2, Loader2, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ChatMessage } from "@/lib/types"
import { sendChatMessage, SUGGESTED_QUESTIONS } from "@/lib/ai/aiAssistant"

interface AIAssistantProps {
  context?: {
    city?: string
    aqi?: number
    aqiCategory?: string
    temperature?: number
    humidity?: number
    windSpeed?: number
    condition?: string
    ecoScore?: number
  }
}

export function AIAssistant({ context }: AIAssistantProps) {
  const [open,      setOpen]      = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages,  setMessages]  = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hi! I'm EcoPulse AI 🌱 I can help you understand air quality, pollution, and how to live more sustainably${context?.city ? ` in ${context.city}` : ""}. Ask me anything!`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input,   setInput]   = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef  = useRef<HTMLDivElement>(null)
  const inputRef   = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, open])

  useEffect(() => {
    if (open && !minimized) inputRef.current?.focus()
  }, [open, minimized])

  const handleSend = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput("")

    const userMsg: ChatMessage = { role: "user", content: msg, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    const response = await sendChatMessage(msg, messages, context)
    const aiMsg: ChatMessage = { role: "assistant", content: response, timestamp: new Date().toISOString() }
    setMessages((prev) => [...prev, aiMsg])
    setLoading(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-gradient-to-br from-teal-500 to-emerald-600 text-white rounded-full px-4 py-3 shadow-2xl shadow-emerald-900/50 hover:scale-105 transition-all duration-200 group"
        aria-label="Open EcoPulse AI Assistant"
      >
        <Bot className="h-5 w-5" />
        <span className="text-sm font-medium group-hover:max-w-32 max-w-0 overflow-hidden whitespace-nowrap transition-all duration-300">
          EcoPulse AI
        </span>
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 animate-pulse" />
      </button>
    )
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col rounded-2xl shadow-2xl shadow-black/50 border border-white/15 overflow-hidden transition-all duration-300 ${
        minimized ? "w-72 h-14" : "w-80 sm:w-96 h-[32rem]"
      }`}
      style={{ background: "linear-gradient(135deg, rgb(15 23 42 / 0.98), rgb(15 23 42 / 0.95))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-teal-600/30 to-emerald-600/30 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">EcoPulse AI</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              Online · Gemini-powered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(!minimized)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            {minimized ? <Maximize2 className="h-3.5 w-3.5" /> : <Minimize2 className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                      <Bot className="h-3 w-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-teal-600 to-emerald-700 text-white rounded-tr-sm"
                        : "bg-white/10 text-foreground rounded-tl-sm"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center mr-2 mt-0.5 shrink-0">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-white/10 rounded-2xl rounded-tl-sm px-3 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Suggested Questions (only when 1 message) */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTED_QUESTIONS.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs bg-white/10 hover:bg-white/20 text-muted-foreground hover:text-foreground border border-white/10 rounded-full px-2.5 py-1 transition-colors text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-4 pt-2 border-t border-white/10 shrink-0">
            <div className="flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl px-3 py-2 transition-colors">
              <MessageCircle className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about environment..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                disabled={loading}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 text-white disabled:opacity-40 hover:scale-105 transition-all shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
