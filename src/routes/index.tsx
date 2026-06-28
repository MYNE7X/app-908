import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Video, ShieldCheck, Wallet, ArrowRight, Star, Users, Zap,
  TrendingUp, Calendar, CalendarDays, Key, Check,
  BookOpen, Database, Award, Quote, ChevronDown, MessageCircle,
} from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { supabase } from "@/integrations/supabase/client";
import { PayoutTicker } from "@/components/payout-ticker";

export const Route = createFileRoute("/")({
  component: Index,
});

const PACKAGES = [
  {
    name: "Starter",
    price: "₨799",
    tagline: "Video Watching",
    daily: "₨80",
    weekly: "₨560",
    monthly: "₨2,400",
    from: "from-emerald-600",
    to: "to-emerald-900",
    accent: "text-emerald-300",
    icon: Video,
    features: ["Watch 5–10 videos/day", "Daily earning ₨80", "OPay / Mashreq withdrawal"],
  },
  {
    name: "Professional",
    price: "₨1,299",
    tagline: "Assignment Writing",
    daily: "₨250",
    weekly: "₨1,750",
    monthly: "₨7,500",
    from: "from-violet-600",
    to: "to-violet-900",
    accent: "text-violet-300",
    icon: BookOpen,
    badge: "Most Popular",
    features: ["Essay & assignment writing", "Daily earning ₨250", "Priority tasks"],
  },
  {
    name: "Premium",
    price: "₨4,500",
    tagline: "Video + Data Entry",
    daily: "₨400",
    weekly: "₨2,800",
    monthly: "₨12,000",
    from: "from-amber-500",
    to: "to-orange-700",
    accent: "text-yellow-300",
    icon: Database,
    features: ["Videos + data entry tasks", "Daily earning ₨400", "VIP support"],
  },
];

const REVIEWS = [
  { name: "Ahmed Khan", location: "Lahore, Pakistan", rating: 5, text: "Best earning platform I have used. Withdrawals are fast and support is friendly.", avatar: "#6366f1" },
  { name: "Ayesha Siddiqui", location: "Karachi, Pakistan", rating: 5, text: "I made my first 5000 PKR in just one week. Highly recommended for students.", avatar: "#10b981" },
  { name: "Hassan Raza", location: "Faisalabad, Pakistan", rating: 5, text: "Customer support replied within minutes. Truly a trustworthy platform.", avatar: "#f59e0b" },
  { name: "Sana Malik", location: "Rawalpindi, Pakistan", rating: 5, text: "Withdrew via JazzCash, received in 10 minutes. Amazing experience overall!", avatar: "#ec4899" },
  { name: "Fatima Noor", location: "Multan, Pakistan", rating: 5, text: "Truly life changing. The video tasks are simple and very rewarding.", avatar: "#8b5cf6" },
  { name: "Usman Tariq", location: "Peshawar, Pakistan", rating: 4, text: "Good packages and consistent earnings. Will definitely recommend to friends.", avatar: "#06b6d4" },
  { name: "Zain Abbas", location: "Sialkot, Pakistan", rating: 5, text: "I am a college student and this helps cover all my monthly expenses.", avatar: "#ef4444" },
  { name: "Maryam Sheikh", location: "Gujranwala, Pakistan", rating: 5, text: "Smooth experience from signup to first withdrawal. No issues at all.", avatar: "#14b8a6" },
  { name: "Bilal Ahmad", location: "Islamabad, Pakistan", rating: 4, text: "Tasks are easy and instructions are clear. Payment received on time.", avatar: "#f97316" },
];

const FAQS_PREVIEW = [
  { q: "Is Expert Solutions real or a scam?", a: "100% real. We have been paying members since 2023. Over 2,400 people across Pakistan earn daily and withdraw directly to OPay or Mashreq Bank." },
  { q: "Do I need any experience to join?", a: "No experience needed at all. If you can watch a short video or type a few sentences, you can do the tasks and earn every day." },
  { q: "How long does it take to receive my withdrawal?", a: "OPay transfers usually arrive within minutes. Mashreq Bank is the same day. Our team handles requests between 9am and 9pm Pakistan time." },
  { q: "Can I join from outside Pakistan?", a: "Yes. Members from the UAE, UK, Saudi Arabia, USA, Canada and many other countries are already earning with us. All tasks are done fully online." },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-white/10 rounded-2xl overflow-hidden transition-all ${open ? "bg-white/10" : "bg-white/5 hover:bg-white/8"}`}>
      <button className="w-full text-left px-5 py-4 flex items-start gap-3" onClick={() => setOpen((o) => !o)}>
        <span className="flex-1 text-sm font-semibold leading-relaxed">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 mt-0.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t border-white/10 pt-3">{a}</div>
      )}
    </div>
  );
}

function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground overflow-x-hidden">

      <PublicHeader />

      <main className="px-4 sm:px-8 max-w-7xl mx-auto">

        {/* ── Hero ───────────────────────────────── */}
        <section className="pt-12 pb-10 sm:pt-20 sm:pb-16 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur border border-white/20 px-3 py-1.5 text-xs font-medium mb-6">
            <Zap className="h-3.5 w-3.5 text-yellow-300" />
            Instant PKR Payouts · Verified Tasks · Real Earnings
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] max-w-3xl">
            Earn real{" "}
            <span className="relative inline-block">
              <span className="relative z-10">PKR daily</span>
              <span className="absolute inset-x-0 bottom-1 h-3 bg-white/25 -rotate-1 rounded" />
            </span>{" "}
            by completing verified tasks.
          </h1>

          <p className="mt-5 text-base sm:text-lg opacity-85 max-w-2xl mx-auto sm:mx-0">
            Pakistan's trusted online earning platform. Watch videos, complete assignments, and do data entry — earn ₨80 to ₨400 per day, withdraw via OPay or Mashreq Bank.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 items-center sm:items-start">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold w-full sm:w-auto shadow-xl shadow-black/20">
              <Link to="/auth" className="flex items-center gap-2">
                Create your account <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20 w-full sm:w-auto">
              <Link to="/about">Learn more</Link>
            </Button>
          </div>

          <div className="mt-8 flex items-center gap-4 justify-center sm:justify-start text-sm opacity-80">
            <div className="flex -space-x-2">
              {["#10b981","#6366f1","#f59e0b","#ec4899"].map((c, i) => (
                <div key={i} className="h-7 w-7 rounded-full border-2 border-white/30 grid place-items-center text-[10px] font-bold text-white" style={{ background: c }}>
                  {["A","B","C","D"][i]}
                </div>
              ))}
            </div>
            <span><strong>2,400+</strong> members earning daily across Pakistan</span>
          </div>
        </section>

      </main>

      <PayoutTicker />

      <main className="px-4 sm:px-8 max-w-7xl mx-auto">

        {/* ── Stats ─────────────────────────── */}
        <section className="grid grid-cols-3 gap-3 pb-10 border-t border-white/10 pt-8">
          {[
            { icon: Users, value: "2,400+", label: "Active members" },
            { icon: Star, value: "4.9★", label: "Average rating" },
            { icon: Zap, value: "₨50L+", label: "Paid out total" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black">{s.value}</div>
              <div className="text-xs sm:text-sm opacity-70 mt-0.5">{s.label}</div>
            </div>
          ))}
        </section>

        {/* ── How it works ──────────────────────── */}
        <section className="pb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">How It Works</h2>
          <p className="text-center opacity-70 text-sm mb-8">Start earning in 3 simple steps</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: "1", icon: Award, title: "Create & Verify", desc: "Sign up, complete your profile, and get your account verified instantly." },
              { step: "2", icon: Key, title: "Choose a Package", desc: "Pick Starter (₨799), Professional (₨1,299), or Premium (₨4,500) — pay via OPay or Mashreq Bank." },
              { step: "3", icon: Wallet, title: "Earn & Withdraw", desc: "Complete daily tasks, earn PKR, and withdraw directly to OPay or Mashreq Bank." },
            ].map((s) => (
              <div key={s.step} className="glass rounded-2xl p-5 border border-white/10 hover:border-white/25 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-8 w-8 rounded-full bg-white/20 grid place-items-center text-sm font-extrabold">{s.step}</div>
                  <s.icon className="h-5 w-5 opacity-80" />
                </div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm opacity-70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Packages ──────────────────────── */}
        <section className="pb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">Earning Packages</h2>
          <p className="text-center opacity-70 text-sm mb-8">All prices in PKR — one-time joining fee</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {PACKAGES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.name}
                  className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${p.from} ${p.to} text-white shadow-xl group hover:scale-[1.02] transition-all duration-200`}
                >
                  {p.badge && (
                    <div className="relative z-10 text-center py-1.5 bg-white/25 backdrop-blur-sm border-b border-white/20 text-[10px] font-bold tracking-widest uppercase">
                      {p.badge}
                    </div>
                  )}
                  <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
                  <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/20 blur-xl" />

                  <div className="relative p-5 flex flex-col min-h-[230px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className={`text-xs font-bold uppercase tracking-widest ${p.accent} mb-1`}>{p.tagline}</div>
                        <h3 className="text-xl font-extrabold">{p.name}</h3>
                      </div>
                      <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-white" />
                      </div>
                    </div>

                    <div className="mt-3 text-3xl font-black">{p.price}</div>

                    <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-black/20 p-2.5 text-center">
                      {[
                        { icon: TrendingUp, label: "Daily", val: p.daily },
                        { icon: CalendarDays, label: "Weekly", val: p.weekly },
                        { icon: Calendar, label: "Monthly", val: p.monthly },
                      ].map((e) => (
                        <div key={e.label}>
                          <e.icon className="h-3 w-3 mx-auto mb-0.5 opacity-70" />
                          <div className="text-[9px] opacity-60 uppercase">{e.label}</div>
                          <div className="text-xs font-bold">{e.val}</div>
                        </div>
                      ))}
                    </div>

                    <ul className="mt-3 space-y-1 flex-1">
                      {p.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5 text-xs opacity-90">
                          <Check className="h-3.5 w-3.5 shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 text-center">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl">
              <Link to="/auth" className="flex items-center gap-2">
                Join now and start earning <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* ── Features ──────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-12 border-t border-white/10 pt-10">
          {[
            { icon: Video, title: "Secure Video Tasks", desc: "Tamper-proof player with automatic watch tracking. Complete videos to unlock daily earnings.", from: "from-cyan-600", to: "to-cyan-900" },
            { icon: ShieldCheck, title: "Verified Submissions", desc: "Upload screenshot proof reviewed by admins. Transparent, fair, and fast approval process.", from: "from-violet-600", to: "to-violet-900" },
            { icon: Wallet, title: "Fast PKR Withdrawals", desc: "Instant withdrawals to OPay or Mashreq Bank — processed within a few hours.", from: "from-emerald-600", to: "to-emerald-900" },
          ].map((f) => (
            <div key={f.title} className={`relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br ${f.from} ${f.to} text-white shadow-lg hover:scale-[1.02] transition-all`}>
              <div className="absolute -top-6 -right-6 h-24 w-24 rounded-full bg-white/10 blur-xl" />
              <div className="relative">
                <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center mb-3">
                  <f.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="mt-1.5 text-sm opacity-75 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── Payment methods ─────────────────── */}
        <section className="pb-14 text-center border-b border-white/10">
          <h2 className="text-xl font-bold mb-2">Supported Payment Methods</h2>
          <p className="opacity-70 text-sm mb-6">Pay to join · Withdraw your earnings</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "OPay", emoji: "💳" },
              { label: "Mashreq Bank", emoji: "🏦" },
              { label: "Bank Transfer", emoji: "🔁" },
            ].map((m) => (
              <div key={m.label} className="rounded-2xl bg-white/10 border border-white/20 px-6 py-3.5 flex items-center gap-2.5 hover:bg-white/20 transition">
                <span className="text-xl">{m.emoji}</span>
                <span className="text-sm font-semibold">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Reviews ───────────────────────────── */}
        <section className="py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2">What Members Say</h2>
          <p className="text-center opacity-70 text-sm mb-10">Real reviews from real earners across Pakistan</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REVIEWS.map((r, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 border border-white/10 hover:border-white/25 transition-all flex flex-col gap-3"
              >
                <Quote className="h-6 w-6 opacity-20 shrink-0" />
                <p className="text-sm leading-relaxed opacity-85 flex-1">"{r.text}"</p>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-bold text-white shrink-0 border-2 border-white/20"
                      style={{ background: r.avatar }}
                    >
                      {r.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold">{r.name}</div>
                      <div className="text-[10px] opacity-50">{r.location}</div>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, si) => (
                      <Star key={si} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    {Array.from({ length: 5 - r.rating }).map((_, si) => (
                      <Star key={si} className="h-3 w-3 fill-white/20 text-white/20" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-xs font-semibold opacity-70">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              4.9 average from 2,400+ verified members
            </div>
          </div>
        </section>

        {/* ── FAQ Preview ───────────────────────── */}
        <section className="pb-14 border-t border-white/10 pt-12">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold mb-1">Common Questions</h2>
              <p className="opacity-60 text-sm">Quick answers to what people ask most</p>
            </div>
            <Button asChild variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20 shrink-0">
              <Link to="/faq" className="flex items-center gap-1.5">
                <MessageCircle className="h-3.5 w-3.5" /> View all FAQs
              </Link>
            </Button>
          </div>
          <div className="space-y-2 max-w-3xl mx-auto">
            {FAQS_PREVIEW.map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </section>

      </main>

      {/* ── Footer ───────────────────────────── */}
      <footer className="border-t border-white/10 py-8 px-4 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs opacity-50">
          <span>© 2025 Expert Solutions · Pakistan</span>
          <div className="flex gap-4">
            <Link to="/" className="hover:opacity-100 transition">Home</Link>
            <Link to="/about" className="hover:opacity-100 transition">About</Link>
            <Link to="/faq" className="hover:opacity-100 transition">FAQ</Link>
            <Link to="/auth" className="hover:opacity-100 transition">Sign in</Link>
          </div>
        </div>
      </footer>

      {/* ── Mobile sticky CTA ─────────────────── */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-50 p-4 bg-gradient-to-t from-[#064e3b] to-transparent">
        <Button asChild size="lg" className="w-full bg-white text-primary font-bold shadow-2xl">
          <Link to="/auth" className="flex items-center justify-center gap-2">
            Get started — it&apos;s free <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
