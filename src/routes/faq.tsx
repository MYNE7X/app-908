import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/public-header";
import { ArrowRight, ChevronDown, MessageCircle, Zap } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
});

const FAQS = [
  {
    category: "Getting Started",
    color: "from-violet-600 to-violet-900",
    items: [
      {
        q: "What is Expert Solutions?",
        a: "Expert Solutions is an online earning platform for Pakistan. You do simple daily tasks — like watching short videos or writing content — and get paid in PKR directly to your mobile wallet or bank account.",
      },
      {
        q: "Do I need any skills or experience?",
        a: "No skills required. If you can watch a video or type a few sentences, you can earn. Our tasks are designed to be simple and easy for anyone to complete.",
      },
      {
        q: "Is Expert Solutions real or a scam?",
        a: "Expert Solutions is 100% real. We have been paying members since 2023 and have over 2,400 active users across Pakistan. Payments are sent directly to OPay and Mashreq Bank — you can withdraw whenever you like.",
      },
      {
        q: "How do I create an account?",
        a: "Tap 'Get started', enter your email and a password, fill in your name and phone number, then pick a package that suits you. It takes about 2–3 minutes.",
      },
      {
        q: "Can people from other countries join?",
        a: "Yes! We have members from the UAE, UK, Saudi Arabia, USA, Canada, and many more countries. All tasks are done online so you can work from anywhere in the world.",
      },
    ],
  },
  {
    category: "Packages & Fees",
    color: "from-emerald-600 to-emerald-900",
    items: [
      {
        q: "How much does it cost to join?",
        a: "We have three options: Starter for ₨799, Professional for ₨1,299, and Premium for ₨4,500. This is a one-time joining fee — you pay once and earn every day after that.",
      },
      {
        q: "How do I pay the joining fee?",
        a: "You can pay using OPay or Mashreq Bank. Just send the amount to our payment number, take a screenshot, and submit it. Our team will activate your account usually within a few hours.",
      },
      {
        q: "Are there any extra charges or hidden fees?",
        a: "No. The joining fee is the only payment you make to us. Withdrawals are completely free on our side.",
      },
      {
        q: "Can I switch to a bigger package later?",
        a: "Yes, you can upgrade at any time. Just pay the difference and let our team know. Your earnings will increase from the next working day.",
      },
    ],
  },
  {
    category: "Earning & Tasks",
    color: "from-amber-500 to-orange-700",
    items: [
      {
        q: "How do I start earning?",
        a: "Once your account is activated, open your dashboard and go to Tasks. Complete the tasks shown for that day and your earnings will be added to your wallet automatically.",
      },
      {
        q: "How much can I earn per day?",
        a: "It depends on your package. Starter members earn ₨80 per day, Professional members earn ₨250 per day, and Premium members earn ₨400 per day.",
      },
      {
        q: "What kind of tasks are there?",
        a: "Most tasks involve watching short videos, writing short paragraphs, or entering basic information. All tasks are straightforward with clear instructions — no guesswork.",
      },
      {
        q: "What if I can't do tasks one day?",
        a: "That is completely fine. You only earn on the days you complete tasks. Your account stays open and you can continue the next day without any problem.",
      },
    ],
  },
  {
    category: "Withdrawals",
    color: "from-cyan-600 to-cyan-900",
    items: [
      {
        q: "When can I take out my money?",
        a: "You can request a withdrawal as soon as you have enough balance — ₨500 minimum for OPay and ₨1,000 for Mashreq Bank. Most requests are completed the same day.",
      },
      {
        q: "How long does a withdrawal take?",
        a: "OPay transfers usually arrive within minutes. Mashreq Bank transfers are completed the same day. Our team processes requests between 9am and 9pm Pakistan time.",
      },
      {
        q: "Which payment methods are available?",
        a: "We currently support OPay mobile wallet and Mashreq Bank account transfers. OPay is faster and recommended for smaller amounts.",
      },
      {
        q: "I live outside Pakistan — can I still withdraw?",
        a: "Yes. You can withdraw to any Pakistani OPay or bank account — for example, a family member's account back home. Just provide the details when you request a withdrawal.",
      },
    ],
  },
  {
    category: "Account Help",
    color: "from-rose-600 to-rose-900",
    items: [
      {
        q: "Is my information kept private?",
        a: "Yes, your personal details are kept completely private. We do not share or sell your information to anyone. Only our trusted team can access account details when needed for support.",
      },
      {
        q: "I forgot my password — what do I do?",
        a: "Go to the sign-in page and tap 'Forgot password'. Enter your email and we will send you a link to reset it. Check your spam folder if you don't see it within a few minutes.",
      },
      {
        q: "Can I have more than one account?",
        a: "No, one account per person only. Having multiple accounts is against our rules and can result in your accounts being closed.",
      },
      {
        q: "How do I contact support?",
        a: "You can reach our support team via WhatsApp. The contact number is available inside your account after you log in. We are available Saturday to Thursday, 9am to 10pm Pakistan time.",
      },
    ],
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border border-white/10 rounded-2xl overflow-hidden transition-all ${open ? "bg-white/10" : "bg-white/5 hover:bg-white/8"}`}>
      <button
        className="w-full text-left px-5 py-4 flex items-start gap-3"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="flex-1 text-sm font-semibold leading-relaxed">{q}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 mt-0.5 opacity-60 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm opacity-70 leading-relaxed border-t border-white/10 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

function FaqPage() {
  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground overflow-x-hidden">
      <PublicHeader />

      <main className="px-4 sm:px-8 max-w-4xl mx-auto">

        {/* ── Hero ─────────────────────────── */}
        <section className="pt-14 pb-12 sm:pt-20 sm:pb-16 text-center">
          <div className="h-16 w-16 rounded-2xl bg-white/15 grid place-items-center mx-auto mb-5">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4">
            Frequently Asked Questions
          </h1>
          <p className="opacity-70 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Everything you need to know about Expert Solutions — from signing up to withdrawing your first earnings.
          </p>
        </section>

        {/* ── FAQ Categories ───────────────── */}
        <div className="space-y-10 pb-16">
          {FAQS.map((cat) => (
            <section key={cat.category}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`h-1.5 w-8 rounded-full bg-gradient-to-r ${cat.color}`} />
                <h2 className="text-base font-bold uppercase tracking-widest opacity-70">{cat.category}</h2>
              </div>
              <div className="space-y-2">
                {cat.items.map((item) => (
                  <FaqItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Still have questions ──────────── */}
        <section className="pb-20 text-center">
          <div className="glass rounded-3xl border border-white/15 px-6 py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-emerald-600/10 rounded-3xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-semibold mb-4 uppercase tracking-widest">
                <Zap className="h-3.5 w-3.5 text-yellow-300" /> Still have questions?
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-3">We're here to help</h2>
              <p className="opacity-65 text-sm mb-7 max-w-md mx-auto">
                Can't find what you're looking for? Contact our support team via WhatsApp after signing in.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 font-bold shadow-xl">
                  <Link to="/auth" className="flex items-center gap-2">
                    Create free account <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/about">About us</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

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
