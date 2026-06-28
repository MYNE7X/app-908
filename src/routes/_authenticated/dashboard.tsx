import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getCurrentUserContext } from "@/lib/auth.functions";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import {
  Wallet, TrendingUp, ListTodo, Video, Package,
  ArrowRight, Star, AlertTriangle, ShieldAlert, Banknote,
  Zap, ChevronRight,
} from "lucide-react";
import { FineAlertSection } from "@/components/fine-alert-section";
import { PayoutFloatingNotification } from "@/components/payout-ticker";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUserContext,
    retry: false,
  });

  const { data: strikes } = useQuery({
    queryKey: ["my-strikes"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("strikes")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const activeStrikes = (strikes ?? []).filter((s: any) => s.is_active !== false);

  const stats = [
    { label: "Available", value: pkr(Number(data?.wallet?.available_balance ?? 0)), icon: Wallet, tone: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-600" },
    { label: "Pending", value: pkr(Number(data?.wallet?.pending_balance ?? 0)), icon: TrendingUp, tone: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-600" },
    { label: "Total Earned", value: pkr(Number(data?.wallet?.total_earned ?? 0)), icon: ListTodo, tone: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-600" },
    { label: "Withdrawn", value: pkr(Number(data?.wallet?.total_withdrawn ?? 0)), icon: Banknote, tone: "from-purple-500/20 to-purple-500/5", iconColor: "text-purple-600" },
  ];

  const isProfileIncomplete = !data?.profile?.full_name || !data?.profile?.phone || !data?.profile?.city;
  const availableBalance = Number(data?.wallet?.available_balance ?? 0);

  return (
    <div className="space-y-6">
      <PayoutFloatingNotification />

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back{data?.profile?.full_name ? `, ${data.profile.full_name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your account at a glance.</p>
      </div>

      {/* Profile incomplete */}
      {isProfileIncomplete && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">Complete your profile</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Add your name, phone, and city to fully activate your account.
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0 border-amber-500/40">
            <Link to="/profile">Fill profile</Link>
          </Button>
        </div>
      )}

      {/* Strikes warning */}
      {activeStrikes.length > 0 && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="font-semibold text-sm text-destructive">
              {activeStrikes.length} active strike{activeStrikes.length > 1 ? "s" : ""}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {activeStrikes[0]?.reason ?? "Violation of platform rules."} 3 strikes = account ban.
            </div>
          </div>
        </div>
      )}

      {/* Fine alerts */}
      <FineAlertSection />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className={`glass shadow-elegant relative overflow-hidden bg-gradient-to-br ${s.tone}`}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{s.label}</CardTitle>
              <s.icon className={`h-4 w-4 ${s.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Withdraw Shortcut */}
      <QuickWithdrawCard availableBalance={availableBalance} />

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="glass hover:shadow-elegant transition-all cursor-pointer group">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Video className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Video Tasks</div>
              <div className="text-xs text-muted-foreground">Watch & earn PKR</div>
            </div>
            <Link to="/video-tasks"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
          </CardContent>
        </Card>
        <Card className="glass hover:shadow-elegant transition-all cursor-pointer group">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 grid place-items-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <ListTodo className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Tasks</div>
              <div className="text-xs text-muted-foreground">Claim & submit</div>
            </div>
            <Link to="/tasks"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
          </CardContent>
        </Card>
        <Card className="glass hover:shadow-elegant transition-all cursor-pointer group">
          <CardContent className="py-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 grid place-items-center text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Package className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">Packages</div>
              <div className="text-xs text-muted-foreground">Upgrade your plan</div>
            </div>
            <Link to="/packages"><ArrowRight className="h-4 w-4 text-muted-foreground" /></Link>
          </CardContent>
        </Card>
      </div>

      {/* Earning guide */}
      <Card className="glass border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500" /> How to Earn More
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          {[
            "Complete your profile to unlock all tasks and features.",
            "Choose a package — Starter (₨799), Professional (₨1,299) or Premium (₨4,500).",
            "Complete daily tasks to earn your daily reward.",
            "Withdraw earnings via OPay or Mashreq Bank transfer.",
          ].map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-primary font-bold mt-0.5">{i + 1}.</span>
              <span>{tip}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Quick Withdraw Card ── unique glowing design ── */
function QuickWithdrawCard({ availableBalance }: { availableBalance: number }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("opay");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [busy, setBusy] = useState(false);

  const canWithdraw = availableBalance >= 500;

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt < 500) return toast.error("Minimum withdrawal is ₨500");
    if (amt > availableBalance) return toast.error("Insufficient balance");
    if (!account.trim()) return toast.error("Enter your account number");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { data, error } = await supabase.rpc("request_withdrawal", {
        _amount: amt,
        _method: method,
        _details: { account: account.trim() },
      });
      if (error || !(data as any)?.success) throw new Error((data as any)?.error ?? error?.message ?? "Failed");
      toast.success("Withdrawal requested! 💸", { description: `₨${amt.toLocaleString()} via ${method === "opay" ? "OPay" : "Mashreq Bank"} — processing within 24 hrs.` });
      setOpen(false);
      setAmount(""); setAccount("");
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) {
      toast.error(e.message ?? "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-emerald-800 to-teal-900 p-5 flex items-center gap-4 border border-emerald-600/40 shadow-lg">
          {/* Icon */}
          <div className="relative shrink-0">
            <div className="h-14 w-14 rounded-2xl bg-emerald-400/20 grid place-items-center">
              <Banknote className="h-7 w-7 text-emerald-300" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Available to withdraw</span>
              <Zap className="h-3 w-3 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">{pkr(availableBalance)}</div>
            <div className="text-xs text-emerald-300/70 mt-0.5">
              {canWithdraw ? "Minimum met · Ready to cash out" : "Earn ₨500 minimum to withdraw"}
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex flex-col gap-2 items-end">
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  disabled={!canWithdraw}
                  className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold gap-1.5 shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                >
                  Withdraw <ChevronRight className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Banknote className="h-5 w-5 text-emerald-600" /> Quick Withdraw
                  </DialogTitle>
                  <DialogDescription className="sr-only">Request a withdrawal from your available balance.</DialogDescription>
                </DialogHeader>

                {/* Balance pill */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Available</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{pkr(availableBalance)}</span>
                </div>

                <div className="space-y-3">
                  {/* Method */}
                  <div>
                    <Label className="text-xs">Payment Method</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {[{ id: "opay", label: "💚 OPay" }, { id: "mashreq", label: "🏦 Mashreq" }].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                            method === m.id ? "bg-primary text-primary-foreground border-primary" : "bg-card hover:bg-muted"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Amount (PKR)</Label>
                    <Input
                      className="mt-1"
                      type="number"
                      min={500}
                      max={availableBalance}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="Min ₨500"
                    />
                  </div>

                  <div>
                    <Label className="text-xs">Your {method === "opay" ? "OPay" : "Mashreq"} Account Number</Label>
                    <Input
                      className="mt-1 font-mono"
                      value={account}
                      onChange={(e) => setAccount(e.target.value)}
                      placeholder={method === "opay" ? "03XX-XXXXXXX" : "Bank account number"}
                    />
                  </div>

                  <Button onClick={submit} disabled={busy} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" size="lg">
                    {busy ? "Processing…" : `Request Withdrawal${amount ? ` — ${pkr(parseFloat(amount) || 0)}` : ""}`}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">Processed within 24 hours. Minimum ₨500.</p>
                </div>
              </DialogContent>
            </Dialog>

            <Link to="/wallet" className="text-[10px] text-emerald-400/60 hover:text-emerald-300 transition-colors flex items-center gap-0.5">
              Full wallet <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          </div>
    </div>
  );
}
