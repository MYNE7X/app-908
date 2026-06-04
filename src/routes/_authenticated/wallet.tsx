import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wallet as WalletIcon, ArrowUpRight, Clock, TrendingUp, Banknote, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet — Expert Solutions" }] }),
  component: WalletPage,
});

function WalletPage() {
  const qc = useQueryClient();
  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase.from("wallets").select("*").eq("user_id", u.user.id).maybeSingle();
      return data;
    },
  });
  const { data: withdrawals } = useQuery({
    queryKey: ["withdrawals"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("withdrawals").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const available = Number(wallet?.available_balance ?? 0);
  const pending = Number(wallet?.pending_balance ?? 0);
  const earned = Number(wallet?.total_earned ?? 0);
  const withdrawn = Number(wallet?.total_withdrawn ?? 0);

  return (
    <div className="space-y-6">
      {/* Hero balance card */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-primary-foreground shadow-elegant bg-gradient-hero">
        <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-primary-glow/40 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-medium">
              <WalletIcon className="h-3.5 w-3.5" /> My wallet
            </div>
            <div className="mt-4 text-sm opacity-80">Available balance</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">${available.toFixed(2)}</span>
              <span className="text-sm opacity-70">{wallet?.currency ?? "USD"}</span>
            </div>
            <div className="mt-2 text-xs opacity-80 inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Pending ${pending.toFixed(2)}
            </div>
          </div>
          <WithdrawDialog max={available} onDone={() => qc.invalidateQueries()} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MiniStat icon={TrendingUp} label="Total earned" value={`$${earned.toFixed(2)}`} tone="from-emerald-500/20 to-emerald-500/5" />
        <MiniStat icon={Banknote} label="Withdrawn" value={`$${withdrawn.toFixed(2)}`} tone="from-blue-500/20 to-blue-500/5" />
        <MiniStat icon={Clock} label="Pending" value={`$${pending.toFixed(2)}`} tone="from-amber-500/20 to-amber-500/5" />
        <MiniStat icon={Sparkles} label="Available" value={`$${available.toFixed(2)}`} tone="from-primary/25 to-primary/5" />
      </div>

      {/* History */}
      <Card className="glass">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base"><ArrowUpRight className="h-4 w-4 text-primary" /> Withdrawal history</CardTitle>
        </CardHeader>
        <CardContent>
          {!withdrawals?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              <WalletIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
              No withdrawals yet.
            </div>
          ) : (
            <div className="space-y-2">
              {withdrawals.map((w) => (
                <div key={w.id} className="flex items-center justify-between rounded-xl border bg-card/60 px-3 py-2.5 text-sm hover:bg-card transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 grid place-items-center text-primary">
                      <Banknote className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">${Number(w.amount).toFixed(2)} <span className="text-xs text-muted-foreground font-normal">via {w.method}</span></div>
                      <div className="text-[11px] text-muted-foreground">{new Date(w.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "paid" || status === "approved" ? "default" :
    status === "rejected" ? "destructive" : "secondary";
  return <Badge variant={tone as any} className="capitalize">{status}</Badge>;
}

function MiniStat({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: string }) {
  return (
    <Card className={`glass relative overflow-hidden bg-gradient-to-br ${tone}`}>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div className="mt-1.5 text-xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function WithdrawDialog({ max, onDone }: { max: number; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("easypaisa");
  const [account, setAccount] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return toast.error("Invalid amount");
    if (amt > max) return toast.error("Exceeds available");
    setSaving(true);
    const { data, error } = await supabase.rpc("request_withdrawal", {
      _amount: amt, _method: method, _details: { account, name } as any,
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Withdrawal requested"); setOpen(false); onDone(); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-glow gap-2">
          <ArrowUpRight className="h-4 w-4" /> Withdraw
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Withdraw funds</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Amount (max ${max.toFixed(2)})</Label><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
          <div><Label>Method</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="easypaisa">Easypaisa</SelectItem>
                <SelectItem value="jazzcash">JazzCash</SelectItem>
                <SelectItem value="bank">Bank transfer</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Account / Email</Label><Input value={account} onChange={(e) => setAccount(e.target.value)} /></div>
          <div><Label>Account name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <Button onClick={submit} disabled={saving} className="w-full">Submit request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
