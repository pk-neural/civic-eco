import { FloatingParticles } from "@/components/particles"
import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-emerald-950 to-teal-950">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-900/40 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-teal-900/40 via-transparent to-transparent" />

      <FloatingParticles />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <LoginForm />
      </div>
    </main>
  )
}
