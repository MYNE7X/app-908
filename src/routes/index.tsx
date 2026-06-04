import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Video, Wallet, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Expert Solutions — Earn rewards by completing tasks" },
      { name: "description", content: "Watch videos, complete tasks, get paid. Expert Solutions is a secure platform for earning verified rewards." },
      { property: "og:title", content: "Expert Solutions" },
      { property: "og:description", content: "Watch videos, complete tasks, get paid." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-gradient-hero text-primary-foreground">
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between max-w-7xl mx-auto">
        <BrandLogo size="lg" variant="onPrimary" showWordmark showTagline />
        <div className="flex gap-2">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild className="bg-white text-primary hover:bg-white/90">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </header>
      <main className="px-6 sm:px-10 max-w-7xl mx-auto pt-12 pb-24">
        <section className="max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight leading-tight">
            Earn rewards by completing verified tasks.
          </h1>
          <p className="mt-5 text-lg opacity-90 max-w-2xl">
            A secure platform with auto-verified video tasks, screenshot proof submissions, and instant earnings tracking.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/auth">Create your account</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 bg-white/10 text-primary-foreground hover:bg-white/20">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </section>
        <section className="mt-20 grid sm:grid-cols-3 gap-4">
          {[
            { icon: Video, title: "Secure video tasks", desc: "Tamper-proof player with automatic watch tracking." },
            { icon: ShieldCheck, title: "Verified submissions", desc: "Screenshot proof uploads reviewed by admins." },
            { icon: Wallet, title: "Real earnings", desc: "Transparent wallet with fast withdrawals." },
          ].map((f) => (
            <div key={f.title} className="glass rounded-xl p-5 text-foreground">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
