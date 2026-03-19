"use client"

import { useEffect, useState } from "react"
import { ExternalLink, Newspaper, Clock, ChevronRight, ChevronLeft } from "lucide-react"
import { fetchEnvironmentalNews, formatRelativeTime, type NewsArticle } from "@/lib/newsService"

export function EnvironmentNews() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading,  setLoading]  = useState(true)
  const [startIdx, setStartIdx] = useState(0)

  const VISIBLE = 3

  useEffect(() => {
    fetchEnvironmentalNews(6).then((data) => {
      setArticles(data)
      setLoading(false)
    })
  }, [])

  const canPrev = startIdx > 0
  const canNext = startIdx + VISIBLE < articles.length

  if (loading) {
    return (
      <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Newspaper className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Environmental News</h2>
            <p className="text-xs text-muted-foreground">Latest climate & pollution updates</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl bg-white/5 animate-pulse h-52" />
          ))}
        </div>
      </div>
    )
  }

  const visible = articles.slice(startIdx, startIdx + VISIBLE)

  return (
    <div className="bg-background/40 backdrop-blur-xl border border-white/20 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Newspaper className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Environmental News</h2>
            <p className="text-xs text-muted-foreground">Latest climate & pollution updates</p>
          </div>
        </div>
        {/* Carousel Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStartIdx(Math.max(0, startIdx - 1))}
            disabled={!canPrev}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <button
            onClick={() => setStartIdx(Math.min(articles.length - VISIBLE, startIdx + 1))}
            disabled={!canNext}
            className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* News Cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {visible.map((article) => (
          <a
            key={article.id}
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col rounded-xl bg-white/5 border border-white/10 overflow-hidden hover:border-blue-500/40 hover:bg-white/8 transition-all duration-200"
          >
            {/* Image */}
            <div className="relative overflow-hidden h-36 bg-slate-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.image}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&q=80"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-full font-medium">
                {article.source}
              </span>
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
              <p className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-blue-300 transition-colors leading-snug">
                {article.title}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 flex-1">
                {article.description}
              </p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/10">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {formatRelativeTime(article.publishedAt)}
                </span>
                <span className="flex items-center gap-1 text-xs text-blue-400 group-hover:text-blue-300 transition-colors">
                  Read more <ExternalLink className="h-3 w-3" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
