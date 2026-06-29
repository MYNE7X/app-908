import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Check, Sparkles, Upload, Key, TrendingUp,
  Calendar, CalendarDays, ArrowRight, Zap,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/packages")({
  head: () => ({ meta: [{ title: "Packages — Expert Solutions" }] }),
  component: PackagesPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function parseFeatures(features: any): string[] {
  if (!features) return [];
  if (Array.isArray(features)) return features.flatMap((f) =>
    typeof f === "string" ? [f] : []
  );
  if (typeof features === "string") {
    try { const p = JSON.parse(features); if (Array.isArray(p)) return p; } catch {}
    return features.split("\n").map((s: string) => s.trim()).filter(Boolean);
  }
  return [];
}

function PackagesPage() {
  const { data: packages, isLoading } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("packages")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return data ?? [];
    },
  });

  const { data: myPurchases } = useQuery({
    queryKey: ["my-purchases"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("package_purchases")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" /> Packages
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose your plan · Pay via OPay or Mashreq Bank · Start earning PKR daily.
        </p>
      </div>

      {/* Redeem key */}
      <RedeemKeyCard />

      {/* Package grid */}
      {isLoading ? (
        <p className="text-muted-foreground text-sm py-4">Loading packages…</p>
      ) : !packages?.length ? (
        <FallbackGrid />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((p: any) => <PackageCard key={p.id} pkg={p} />)}
        </div>
      )}

      {/* My purchases */}
      {!!myPurchases?.length && (
        <div className="space-y-2 pt-2">
          <h2 className="text-base font-semibold">Your Purchase Requests</h2>
          {myPurchases.map((pp: any) => (
            <div
              key={pp.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card/60 px-4 py-3 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium truncate">{pkr(Number(pp.amount))} · {pp.payment_method}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {new Date(pp.created_at).toLocaleString()}
                  {pp.admin_note && ` · ${pp.admin_note}`}
                </div>
              </div>
              <StatusBadge status={pp.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const v = status === "approved" ? "default" : status === "rejected" ? "destructive" : "secondary";
  return <Badge variant={v as any} className="capitalize shrink-0">{status}</Badge>;
}

/* ── Redeem key ───────────────────────────────── */
function RedeemKeyCard() {
  const qc = useQueryClient();
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);

  async function redeem() {
    if (!key.trim()) return toast.error("Enter an activation key");
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("redeem_activation_key", { _key: key.trim() });
      if (error || !(data as any)?.success)
        toast.error((data as any)?.error ?? error?.message ?? "Invalid key");
      else {
        toast.success("Package activated! 🎉", { description: "Your plan is now live. Start earning!" });
        setKey("");
        qc.invalidateQueries();
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold">
        <Key className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Have an Activation Key?
      </div>
      <p className="text-xs text-muted-foreground mb-3">Got a key from admin? Redeem it to instantly activate your package.</p>
      <div className="flex gap-2">
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="KEY-XXXX-XXXX"
          className="font-mono text-sm"
          onKeyDown={(e) => e.key === "Enter" && redeem()}
        />
        <Button onClick={redeem} disabled={busy} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white">
          {busy ? "…" : "Redeem"}
        </Button>
      </div>
    </div>
  );
}

/* ── Package card ─────────────────────────────── */
const CARD_THEMES = [
  { from: "from-emerald-600", to: "to-emerald-800", accent: "text-emerald-300" },
  { from: "from-violet-600", to: "to-violet-900", accent: "text-violet-300" },
  { from: "from-amber-500", to: "to-orange-700", accent: "text-yellow-300" },
];

function PackageCard({ pkg }: { pkg: any }) {
  const rawIdx = Number(pkg.sort_order ?? 1) - 1;
  const idx = ((rawIdx % CARD_THEMES.length) + CARD_THEMES.length) % CARD_THEMES.length;
  const theme = CARD_THEMES[idx] ?? CARD_THEMES[0];
  const daily = Number(pkg.daily_earning ?? pkg.daily ?? 0);
  const features = parseFeatures(pkg.features);
  const price = Number(pkg.price);

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-xl group`}>
      {pkg.is_featured && (
        <div className="absolute top-3 right-3">
          <span className="bg-white/20 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase border border-white/30">
            Most Popular
          </span>
        </div>
      )}
      <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/20 blur-xl" />

      <div className="relative p-5 sm:p-6 flex flex-col gap-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className={`text-xs font-bold uppercase tracking-widest ${theme.accent} mb-1`}>
              {pkg.tagline || "Earning Plan"}
            </div>
            <h3 className="text-xl font-extrabold">{pkg.name}</h3>
          </div>
          {daily > 0 && (
            <div className="shrink-0 text-right">
              <div className={`text-xs ${theme.accent} font-medium`}>per day</div>
              <div className="text-lg font-black">{pkr(daily)}</div>
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <div className="text-3xl font-black tracking-tight">{pkr(price)}</div>
          <div className="text-xs opacity-70 font-medium">one-time package</div>
        </div>

        {/* Description — clamped to 2 lines, no overflow */}
        {pkg.description && (
          <p className="text-sm opacity-80 line-clamp-2 leading-snug">{pkg.description}</p>
        )}

        {/* CTA */}
        <div className="mt-1">
          <PackageDetailDialog pkg={pkg} features={features} daily={daily} theme={theme} />
        </div>
      </div>
    </div>
  );
}

/* ── Detail dialog ───────────────────────────── */
function PackageDetailDialog({
  pkg, features, daily, theme,
}: {
  pkg: any; features: string[]; daily: number; theme: typeof CARD_THEMES[0];
}) {
  const weekly = daily * 7;
  const monthly = daily * 30;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur font-semibold gap-1.5 transition-all"
          size="sm"
        >
          View Details & Buy <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${theme.from} ${theme.to} text-white p-6 pb-8 rounded-t-3xl overflow-hidden`}>
          <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/20 blur-xl" />
          <div className="relative">
            <div className={`text-xs font-bold uppercase tracking-widest ${theme.accent} mb-1`}>
              {pkg.tagline || "Earning Plan"}
            </div>
            <DialogTitle className="text-2xl font-black text-white">{pkg.name}</DialogTitle>
            <DialogDescription className="sr-only">{pkg.name} package details and purchase.</DialogDescription>
            <div className="mt-3 flex items-end gap-4 flex-wrap">
              <div>
                <div className="text-4xl font-black tracking-tight">{pkr(Number(pkg.price))}</div>
                <div className="text-xs opacity-70">one-time joining fee</div>
              </div>
              {daily > 0 && (
                <div className="text-right">
                  <div className={`text-xs ${theme.accent}`}>daily earning</div>
                  <div className="text-2xl font-black">{pkr(daily)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Earnings grid */}
          {daily > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: TrendingUp, label: "Daily", value: pkr(daily) },
                { icon: CalendarDays, label: "Weekly", value: pkr(weekly) },
                { icon: Calendar, label: "Monthly", value: pkr(monthly) },
              ].map((e) => (
                <div key={e.label} className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
                  <e.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{e.label}</div>
                  <div className="text-sm font-black mt-0.5">{e.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Description — full, no clamp */}
          {pkg.description && (
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">About this plan</div>
              <p className="text-sm text-foreground/80 leading-relaxed">{pkg.description}</p>
            </div>
          )}

          {/* Features */}
          {features.length > 0 && (
            <div>
              <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2.5 flex items-center gap-1.5">
                <Zap className="h-3 w-3 text-primary" /> What&apos;s included
              </div>
              <ul className="space-y-2">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="h-5 w-5 rounded-full bg-primary/10 grid place-items-center shrink-0 mt-0.5">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t" />
          <BuySection pkg={pkg} />
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Buy section ──────────────────────────── */
function BuySection({ pkg }: { pkg: any }) {
  const qc = useQueryClient();
  const [method, setMethod] = useState("opay");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const account = method === "opay" ? OPAY : MASHREQ;
  const label = method === "opay" ? "OPay" : "Mashreq Bank";

  async function submit() {
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { toast.error("Please sign in"); return; }

      let screenshot_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${u.user.id}/purchases/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("proof-uploads").upload(path, file, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("proof-uploads").getPublicUrl(path);
        screenshot_url = pub.publicUrl;
      }

      const { error } = await supabase.from("package_purchases").insert({
        user_id: u.user.id,
        package_id: pkg.id,
        amount: pkg.price,
        currency: pkg.currency ?? "PKR",
        payment_method: method,
        payer_name: payerName || null,
        payer_phone: payerPhone || null,
        notes: notes || null,
        screenshot_url,
      });
      if (error) throw error;

      toast.success("Request submitted! ✅", { description: "We'll activate your package within a few hours." });
      setFile(null); setPayerName(""); setPayerPhone(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["my-purchases"] });
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
        <Upload className="h-3 w-3 text-primary" /> Submit Purchase
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          { id: "opay", label: "OPay", emoji: "💚" },
          { id: "mashreq", label: "Mashreq Bank", emoji: "🏦" },
        ].map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMethod(m.id)}
            className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              method === m.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card hover:bg-muted"
            }`}
          >
            {m.emoji} {m.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-muted/60 border px-3 py-2.5 text-sm">
        <span>
          <span className="font-bold">{label}:</span>{" "}
          <span className="font-mono">{account}</span>
        </span>
        <Button
          size="sm" variant="ghost" className="h-7 px-1.5"
          onClick={() => { navigator.clipboard.writeText(account); toast.success("Copied!"); }}
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Your Name</Label>
          <Input className="mt-0.5 text-sm" value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="Sender name" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input className="mt-0.5 text-sm" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} placeholder="03XX-XXXXXXX" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Payment Screenshot <span className="text-muted-foreground">(attach proof)</span></Label>
        <Input
          type="file"
          accept="image/*"
          className="mt-0.5 text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file && <p className="text-xs text-emerald-600 mt-1">✓ {file.name}</p>}
      </div>

      <div>
        <Label className="text-xs">Notes (optional)</Label>
        <Textarea className="mt-0.5 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Transaction ID or any notes…" />
      </div>

      <Button onClick={submit} disabled={busy} className="w-full" size="lg">
        {busy ? "Submitting…" : `Submit Request — ${pkr(Number(pkg.price))}`}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        We verify and activate within a few hours. You&apos;ll see status updates below.
      </p>
    </div>
  );
}

/* ── Fallback packages ───────────────────────── */
const FALLBACK = [
  {
    id: "f1", name: "Starter", tagline: "Video Watching", price: 799,
    description: "Watch short YouTube videos daily and earn ₨80 per day. Simple, easy, and no experience needed.",
    daily: 80, features: ["Watch 5–10 videos per day", "Daily earning ₨80", "Weekly ₨560 · Monthly ₨2,400", "Withdraw via OPay or Mashreq", "24/7 support"],
    sort_order: 1, is_featured: false,
  },
  {
    id: "f2", name: "Professional", tagline: "Assignment Writing", price: 1299,
    description: "Write essays and college assignments submitted by clients worldwide. Earn ₨250 every day.",
    daily: 250, features: ["Essay & assignment writing", "College / university tasks", "Daily earning ₨250", "Weekly ₨1,750 · Monthly ₨7,500", "Priority task assignment"],
    sort_order: 2, is_featured: true,
  },
  {
    id: "f3", name: "Premium", tagline: "Video + Data Entry", price: 4500,
    description: "Combine video watching and data entry for maximum daily income. Best ROI on the platform.",
    daily: 400, features: ["Video watching tasks", "Data entry tasks", "Daily earning ₨400", "Weekly ₨2,800 · Monthly ₨12,000", "VIP support"],
    sort_order: 3, is_featured: false,
  },
];

function FallbackGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {FALLBACK.map((p) => {
        const theme = CARD_THEMES[(p.sort_order - 1) % CARD_THEMES.length];
        return (
          <div key={p.id} className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${theme.from} ${theme.to} text-white shadow-xl group`}>
            {p.is_featured && (
              <div className="absolute top-3 right-3">
                <span className="bg-white/20 backdrop-blur text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase border border-white/30">Most Popular</span>
              </div>
            )}
            <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
            <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-black/20 blur-xl" />
            <div className="relative p-5 sm:p-6 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`text-xs font-bold uppercase tracking-widest ${theme.accent} mb-1`}>{p.tagline}</div>
                  <h3 className="text-xl font-extrabold">{p.name}</h3>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-xs ${theme.accent}`}>per day</div>
                  <div className="text-lg font-black">{pkr(p.daily)}</div>
                </div>
              </div>
              <div>
                <div className="text-3xl font-black tracking-tight">{pkr(p.price)}</div>
                <div className="text-xs opacity-70">one-time package</div>
              </div>
              <p className="text-sm opacity-80 line-clamp-2 leading-snug">{p.description}</p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur font-semibold gap-1.5" size="sm">
                    View Details & Buy <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-3xl">
                  <div className={`relative bg-gradient-to-br ${theme.from} ${theme.to} text-white p-6 pb-8 rounded-t-3xl overflow-hidden`}>
                    <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10 blur-xl" />
                    <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/20 blur-xl" />
                    <div className="relative">
                      <div className={`text-xs font-bold uppercase tracking-widest ${theme.accent} mb-1`}>{p.tagline}</div>
                      <DialogTitle className="text-2xl font-black text-white">{p.name}</DialogTitle>
                      <DialogDescription className="sr-only">{p.name} package details.</DialogDescription>
                      <div className="mt-3 flex items-end gap-4">
                        <div>
                          <div className="text-4xl font-black">{pkr(p.price)}</div>
                          <div className="text-xs opacity-70">one-time joining fee</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xs ${theme.accent}`}>daily earning</div>
                          <div className="text-2xl font-black">{pkr(p.daily)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 space-y-5">
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { icon: TrendingUp, label: "Daily", value: pkr(p.daily) },
                        { icon: CalendarDays, label: "Weekly", value: pkr(p.daily * 7) },
                        { icon: Calendar, label: "Monthly", value: pkr(p.daily * 30) },
                      ].map((e) => (
                        <div key={e.label} className="rounded-2xl bg-primary/5 border border-primary/10 p-3 text-center">
                          <e.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{e.label}</div>
                          <div className="text-sm font-black mt-0.5">{e.value}</div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">About this plan</div>
                      <p className="text-sm text-foreground/80 leading-relaxed">{p.description}</p>
                    </div>
                    <ul className="space-y-2">
                      {p.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <div className="h-5 w-5 rounded-full bg-primary/10 grid place-items-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="border-t" />
                    <BuySection pkg={p} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        );
      })}
    </div>
  );
}
