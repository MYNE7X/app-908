import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gavel, Upload, Copy, ShieldX, Clock, Lock } from "lucide-react";

const OPAY = "03371441111";
const MASHREQ = "089120147898";

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

export function FineAlertSection() {
  const { data: fines, isLoading } = useQuery({
    queryKey: ["my-fines"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase
        .from("fines")
        .select("*")
        .eq("user_id", u.user.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  if (isLoading) return null;

  const unpaid = (fines ?? []).filter(
    (f: any) => f.status !== "paid" && f.status !== "approved" && f.status !== "cancelled"
  );

  if (!unpaid.length) return null;

  return <FineBlockingOverlay fines={unpaid} />;
}

function FineBlockingOverlay({ fines }: { fines: any[] }) {
  const totalAmount = fines.reduce((s: number, f: any) => s + Number(f.amount), 0);
  const [activeFine, setActiveFine] = useState<any>(fines[0]);

  return (
    /* Fixed full-screen overlay — blocks all content */
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-xl" />

      {/* Background glow */}
      <div className="absolute inset-0 bg-destructive/5" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4 rounded-3xl overflow-hidden shadow-2xl border border-destructive/30 bg-card">

        {/* Red header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-red-600 to-rose-800 text-white px-6 py-7">
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/10 blur-xl" />
          <div className="absolute -bottom-10 -left-6 h-32 w-32 rounded-full bg-black/20 blur-xl" />

          <div className="relative flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/15 border border-white/20 grid place-items-center shrink-0">
              <ShieldX className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest opacity-80 font-semibold">Account Restricted</div>
              <div className="text-2xl font-extrabold mt-0.5 leading-tight">Fine Issued</div>
              <div className="text-sm opacity-80 mt-0.5">
                {fines.length > 1 ? `${fines.length} fines` : "1 fine"} totalling{" "}
                <span className="font-bold text-yellow-300">{pkr(totalAmount)}</span>
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-black/20 border border-white/15 px-3 py-2 text-xs text-white/80">
            <Lock className="h-3.5 w-3.5 shrink-0 text-yellow-300" />
            Your account is locked until all fines are paid and verified by admin.
          </div>
        </div>

        {/* Fine tabs (if multiple) */}
        {fines.length > 1 && (
          <div className="flex border-b overflow-x-auto">
            {fines.map((f: any, i: number) => (
              <button
                key={f.id}
                onClick={() => setActiveFine(f)}
                className={`flex-1 py-2.5 px-3 text-xs font-semibold transition-colors min-w-[80px] ${
                  activeFine.id === f.id
                    ? "border-b-2 border-destructive text-destructive bg-destructive/5"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                Fine {i + 1}
                <div className="text-[10px] font-bold">{pkr(Number(f.amount))}</div>
              </button>
            ))}
          </div>
        )}

        {/* Fine detail & proof form */}
        <div className="p-5 space-y-4">
          <FinePaySection fine={activeFine} />
        </div>
      </div>
    </div>
  );
}

function FinePaySection({ fine }: { fine: any }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const isSubmitted = fine.status === "submitted";

  function copy(t: string) { navigator.clipboard.writeText(t); toast.success("Copied!"); }

  async function submit() {
    if (!file) return toast.error("Please select your payment screenshot first");
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${u.user.id}/fines/${fine.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("proof-uploads").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("proof-uploads").getPublicUrl(path);
      const { data, error } = await supabase.rpc("submit_fine_proof", {
        _fine_id: fine.id,
        _screenshot_url: pub.publicUrl,
      });
      if (error || !(data as any)?.success)
        throw new Error((data as any)?.error ?? error?.message ?? "Failed");
      toast.success("Proof submitted! Admin will verify and unlock your account shortly.");
      setFile(null);
      qc.invalidateQueries({ queryKey: ["my-fines"] });
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {/* Fine info */}
      <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide font-bold text-muted-foreground">Fine Amount</span>
          <span className="text-xl font-black text-destructive">{pkr(Number(fine.amount))}</span>
        </div>
        {fine.reason && (
          <div>
            <span className="text-xs text-muted-foreground">Reason: </span>
            <span className="text-sm font-medium">{fine.reason}</span>
          </div>
        )}
        <div className="text-[11px] text-muted-foreground">
          Issued {new Date(fine.created_at).toLocaleDateString()}
        </div>
      </div>

      {isSubmitted ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">Proof submitted</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              Admin is reviewing your payment. Your account will be unlocked once verified — usually within a few hours.
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Payment accounts */}
          <div>
            <div className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Pay to any of these accounts</div>
            <div className="space-y-2">
              {[
                { label: "OPay", value: OPAY },
                { label: "Mashreq Bank", value: MASHREQ },
              ].map((r) => (
                <div key={r.label} className="flex items-center justify-between gap-2 rounded-xl bg-muted/60 border px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded shrink-0">{r.label}</span>
                    <span className="font-mono text-sm font-semibold">{r.value}</span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 px-1.5 shrink-0" onClick={() => copy(r.value)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Upload */}
          <div>
            <Label className="text-sm font-semibold">Upload Payment Screenshot</Label>
            <div className="mt-1.5 relative">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
            </div>
            {file && (
              <p className="text-xs text-emerald-600 mt-1.5 flex items-center gap-1">
                ✓ {file.name}
              </p>
            )}
          </div>

          <Button
            onClick={submit}
            disabled={busy || !file}
            className="w-full bg-destructive hover:bg-destructive/90 text-white gap-2 font-bold h-11"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Uploading…" : `Submit Proof — ${pkr(Number(fine.amount))}`}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Pay the fine above, then upload your screenshot. Admin will verify and unlock your account.
          </p>
        </>
      )}
    </>
  );
}
