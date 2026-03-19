"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Leaf,
  LayoutDashboard,
  Edit3,
  BarChart3,
  Map,
  TrendingUp,
  Recycle,
  Info,
  MapPin,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getUser, clearUserLocally, logoutUser } from "@/lib/storage"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/daily-input", label: "Daily Input", icon: Edit3 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/heatmap", label: "India Heatmap", icon: Map },
  { href: "/trends", label: "Trends", icon: TrendingUp },
  { href: "/tackle-pollution", label: "Tackle Pollution", icon: Recycle },
  { href: "/about", label: "About", icon: Info },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    getUser().then(u => setUser(u))
  }, [])

  const handleLogout = async () => {
    await logoutUser()
    router.push("/")
  }

  const handleChangeCity = () => {
    clearUserLocally()
    router.push("/")
  }

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EcoPulse
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-emerald-500" />
                <span>{user.city}</span>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-xl border-white/20">
                {user && (
                  <>
                    <div className="px-3 py-2">
                      <p className="text-sm font-medium text-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {user.city}, {user.state}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-white/10" />
                  </>
                )}
                <DropdownMenuItem onClick={handleChangeCity} className="cursor-pointer">
                  <MapPin className="mr-2 h-4 w-4" />
                  Change City
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-400">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="lg:hidden flex items-center gap-1 pb-3 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
