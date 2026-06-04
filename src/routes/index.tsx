import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Video, ShieldCheck, Wallet, ArrowRight, Star, Users, Zap } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { LogoIcon } from "@/components/logo-icon";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-gradient-hero/80 backdrop-blur-md border-b border-white/10">
        <div className="px-4 sm:px-8 py-3 flex items-center justify-between gap-2 max-w-7xl mx-auto">
          {/* Mobile: icon only — desktop: full logo with wordmark */}
          <LogoIcon className="h-9 w-9 sm:hidden shrink-0" />
          <BrandLogo size="sm" variant="onPrimary" showWordmark className="hidden sm:flex" />

          <div className="flex items-center gap-2 shrink-0">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground px-3"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="bg-white text-primary hover:bg-white/90 font-semibold shadow-md">
              <Link to="/auth">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────── */}
      <main className="px-4 sm:px-8 max-w-7xl mx-auto">
        <section className="pt-12 pb-10 sm:pt-20 sm:pb-16 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1.5 text-xs font-medium mb-6">
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            Instant payouts · Verified tasks · Real earnings
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-3xl">
            Earn rewards by completing{" "}
            <span className="relative">
              <span className="relative z-10">verified tasks.</span>
              <span className="absolute inset-x-0 bottom-0 h-3 bg-white/20 -rotate-1 rounded" />
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg opacity-85 max-w-xl mx-auto sm:mx-0">
            A secure platform with auto-verified video tasks, screenshot proof submissions, and instant earnings
            tracking.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center sm:items-start">
            <Button
              asChild
              size="lg"
              className="bg-white text-primary hover:bg-white/90 font-bold w-full sm:w-auto shadow-xl shadow-black/20"
            >
              <Link to="/auth" className="flex items-center gap-2">
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 w-full sm:w-auto"
            >
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-4 justify-center sm:justify-start text-sm opacity-80">
            <div className="flex -space-x-2">
              {["#22d3ee", "#6366f1", "#c026d3", "#f59e0b"].map((c, i) => (
                <div
                  key={i}
                  className="h-7 w-7 rounded-full border-2 border-white/30 grid place-items-center text-[10px] font-bold text-white"
                  style={{ background: c }}
                >
                  {["A", "B", "C", "D"][i]}
                </div>
              ))}
            </div>
            <span>
              <strong>2,400+</strong> members earning daily
            </span>
          </div>
        </section>

        {/* ── Feature cards ───────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-12">
          {[
            {
              icon: Video,
              title: "Secure video tasks",
              desc: "Tamper-proof player with automatic watch tracking. Complete videos to unlock proof submission.",
              accent: "from-cyan-500/20 to-cyan-500/5",
            },
            {
              icon: ShieldCheck,
              title: "Verified submissions",
              desc: "Upload screenshot proof that gets reviewed by admins. Transparent approval process.",
              accent: "from-primary/20 to-primary/5",
            },
            {
              icon: Wallet,
              title: "Real earnings",
              desc: "Transparent wallet with fast withdrawals. Support for Easypaisa, JazzCash, PayPal & bank transfers.",
              accent: "from-fuchsia-500/20 to-fuchsia-500/5",
            },
          ].map((f) => (
            <div
              key={f.title}
              className={`glass rounded-2xl p-5 bg-gradient-to-br ${f.accent} border border-white/10 hover:border-white/20 transition-all duration-200 hover:scale-[1.02]`}
            >
              <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center mb-3">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/70 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* ── Stats bar ───────────────────────────────────────── */}
        <section className="grid grid-cols-3 gap-3 pb-16 border-t border-white/10 pt-8">
          {[
            { icon: Users, value: "2,400+", label: "Active members" },
            { icon: Star, value: "4.9★", label: "Average rating" },
            { icon: Zap, value: "$50K+", label: "Paid out total" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{s.value}</div>
              <div className="text-xs sm:text-sm opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </section>
      </main>

      {/* ── Mobile sticky CTA ───────────────────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-[#1e1b4b] to-transparent">
        <Button asChild size="lg" className="w-full bg-white text-primary font-bold shadow-2xl">
          <Link to="/auth" className="flex items-center justify-center gap-2">
            Get started — it&apos;s free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
