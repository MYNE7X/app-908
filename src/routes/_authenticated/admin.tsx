import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Video, Clock, ImageIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Expert Solutions" }] }),
  component: AdminPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function AdminPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => { const { data } = await supabase.rpc("get_admin_stats"); return data as any; },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground mt-1">Review submissions, withdrawals, and content.</p>
      </div>
      {stats?.success && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total users" value={stats.totalUsers} />
          <Stat label="Clients" value={stats.totalClients} />
          <Stat label="Submitted" value={stats.tasksSubmitted} />
          <Stat label="Approved" value={stats.tasksApproved} />
          <Stat label="Pending withdrawals" value={stats.pendingWithdrawals} />
          <Stat label="Pending reviews" value={stats.pendingReviews} />
          <Stat label="Paid out" value={pkr(Number(stats.totalPaid ?? 0))} />
        </div>
      )}
      <Tabs defaultValue="queue">
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="inline-flex w-max min-w-full">
            <TabsTrigger value="queue">Task queue</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="fines">Fines</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="purchases">Purchases</TabsTrigger>
            <TabsTrigger value="joins">Plan joins</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="videos" className="gap-1.5"><Video className="h-3.5 w-3.5" />Videos</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="queue"><TaskQueue /></TabsContent>
        <TabsContent value="withdrawals"><WithdrawalsQueue /></TabsContent>
        <TabsContent value="fines"><FinesQueue /></TabsContent>
        <TabsContent value="reviews"><ReviewsQueue /></TabsContent>
        <TabsContent value="purchases"><PurchasesQueue /></TabsContent>
        <TabsContent value="joins"><PlanJoinsQueue /></TabsContent>
        <TabsContent value="users"><UsersList /></TabsContent>
        <TabsContent value="videos"><VideoQueue /></TabsContent>
      </Tabs>
    </div>
  );
}

function UsersList() {
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, created_at, wallets(available_balance, total_earned)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });
  if (!data?.length) return <p className="text-muted-foreground mt-4">No users yet.</p>;
  return (
    <div className="grid gap-2 mt-4">
      {data.map((u: any) => {
        const w = Array.isArray(u.wallets) ? u.wallets[0] : u.wallets;
        return (
          <Card key={u.id} className="glass">
            <CardContent className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium truncate">{u.full_name ?? u.username ?? u.id}</div>
                <div className="text-xs text-muted-foreground truncate">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">{pkr(Number(w?.available_balance ?? 0))}</div>
                <div className="text-[10px] text-muted-foreground">earned {pkr(Number(w?.total_earned ?? 0))}</div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <Card className="glass">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}

function TaskQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["review-queue"],
    queryFn: async () => { const { data } = await supabase.rpc("get_review_queue"); return (data as any[]) ?? []; },
  });
  async function review(id: string, approve: boolean, reason?: string) {
    const { data, error } = await supabase.rpc("review_task", { _task_id: id, _approve: approve, _reason: reason ?? undefined });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success(approve ? "Approved" : "Rejected"); qc.invalidateQueries(); }
  }
  if (!data?.length) return <p className="text-muted-foreground mt-4">No tasks awaiting review.</p>;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((t) => (
        <Card key={t.id} className="glass">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">by {t.user_full_name ?? t.user_username}</p>
              </div>
              <span className="text-sm font-medium">{pkr(Number(t.reward))}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {t.submission_text && <p className="text-sm">{t.submission_text}</p>}
            {t.submission_url && <a href={t.submission_url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">View URL</a>}
            {Array.isArray(t.proof_files) && t.proof_files.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {t.proof_files.map((f: string) => <a key={f} href={f} target="_blank" rel="noreferrer"><img src={f} className="h-20 w-20 rounded border object-cover" /></a>)}
              </div>
            )}
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" onClick={() => review(t.id, true)}>Approve</Button>
              <RejectDialog onConfirm={(reason) => review(t.id, false, reason)} />
              <RevokeDialog taskId={t.id} onRevoked={() => qc.invalidateQueries()} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function RejectDialog({ onConfirm }: { onConfirm: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="destructive">Reject</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Rejection reason</DialogTitle></DialogHeader>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        <Button onClick={() => { onConfirm(reason); setOpen(false); }} variant="destructive">Confirm reject</Button>
      </DialogContent>
    </Dialog>
  );
}

function WithdrawalsQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["withdraw-queue"],
    queryFn: async () => {
      const { data: ws } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: true });
      if (!ws?.length) return [];
      const ids = Array.from(new Set(ws.map((w) => w.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return ws.map((w) => ({ ...w, profile: map.get(w.user_id) }));
    },
  });
  async function process(id: string, approve: boolean) {
    const { data, error } = await supabase.rpc("process_withdrawal", { _withdrawal_id: id, _approve: approve, _note: undefined });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success(approve ? "Marked paid" : "Rejected"); qc.invalidateQueries({ queryKey: ["withdraw-queue"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }
  }
  if (!data?.length) return <p className="text-muted-foreground mt-4">No pending withdrawals.</p>;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((w: any) => (
        <Card key={w.id} className="glass">
          <CardContent className="py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="font-medium">{pkr(Number(w.amount))} via {w.method}</div>
              <div className="text-xs text-muted-foreground">{w.profile?.full_name ?? w.profile?.username ?? w.user_id}</div>
              {w.details && <pre className="text-xs mt-1 text-muted-foreground">{JSON.stringify(w.details)}</pre>}
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => process(w.id, true)}>Mark paid</Button>
              <Button size="sm" variant="destructive" onClick={() => process(w.id, false)}>Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FinesQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-fines"],
    queryFn: async () => {
      const { data: fines } = await supabase
        .from("fines")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (!fines?.length) return [];
      const ids = Array.from(new Set(fines.map((f) => f.user_id)));
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const map = new Map((profs ?? []).map((p) => [p.id, p]));
      return fines.map((f) => ({ ...f, profile: map.get(f.user_id) }));
    },
  });

  async function review(id: string, approve: boolean) {
    const { data, error } = await supabase.rpc("review_fine_payment", { _fine_id: id, _approve: approve });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success(approve ? "Fine cleared" : "Proof rejected"); qc.invalidateQueries({ queryKey: ["admin-fines"] }); }
  }

  if (!data?.length) return <p className="text-muted-foreground mt-4">No fines on record.</p>;

  const statusColor = (s: string | null) =>
    s === "paid" ? "default" : s === "submitted" ? "secondary" : s === "rejected" ? "destructive" : "secondary";

  return (
    <div className="grid gap-3 mt-4">
      {data.map((f: any) => (
        <Card key={f.id} className="glass">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold">{pkr(Number(f.amount))} fine</div>
                <div className="text-xs text-muted-foreground">{f.profile?.full_name ?? f.profile?.username ?? f.user_id}</div>
                {f.reason && <p className="text-xs text-muted-foreground mt-1">{f.reason}</p>}
                <div className="text-[11px] text-muted-foreground mt-1">{new Date(f.created_at).toLocaleString()}</div>
              </div>
              <Badge variant={statusColor(f.status) as any} className="capitalize shrink-0">{f.status ?? "pending"}</Badge>
            </div>
            {f.proof_screenshot_url && (
              <a href={f.proof_screenshot_url} target="_blank" rel="noreferrer" className="block">
                <img src={f.proof_screenshot_url} alt="Fine proof" className="max-h-40 rounded border object-contain bg-muted" />
              </a>
            )}
            {f.status === "submitted" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review(f.id, true)}>Clear fine</Button>
                <Button size="sm" variant="destructive" onClick={() => review(f.id, false)}>Reject proof</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewsQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["pending-reviews"],
    queryFn: async () => {
      const { data } = await supabase.from("reviews").select("*").eq("status", "pending").order("created_at", { ascending: true });
      return data ?? [];
    },
  });
  async function act(id: string, approve: boolean) {
    const { data, error } = await supabase.rpc("approve_review", { _review_id: id, _approve: approve, _note: undefined });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Done"); qc.invalidateQueries(); }
  }
  if (!data?.length) return <p className="text-muted-foreground mt-4">No pending reviews.</p>;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((r) => (
        <Card key={r.id} className="glass">
          <CardContent className="py-4 space-y-2">
            <div className="font-medium">{r.title ?? `Rating ${r.rating}`}</div>
            {r.content && <p className="text-sm text-muted-foreground">{r.content}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={() => act(r.id, true)}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => act(r.id, false)}>Reject</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PurchasesQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("package_purchases")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (!rows?.length) return [];
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      const pkgIds = Array.from(new Set(rows.map((r) => r.package_id)));
      const [profs, pkgs] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username").in("id", userIds),
        supabase.from("packages").select("id, name").in("id", pkgIds),
      ]);
      const pm = new Map((profs.data ?? []).map((p) => [p.id, p]));
      const km = new Map((pkgs.data ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: pm.get(r.user_id), pkg: km.get(r.package_id) }));
    },
  });
  async function review(id: string, approve: boolean, note?: string) {
    const { data, error } = await supabase.rpc("review_package_purchase", { _id: id, _approve: approve, _note: note ?? undefined });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success(approve ? "Approved" : "Rejected"); qc.invalidateQueries({ queryKey: ["admin-purchases"] }); }
  }
  if (!data?.length) return <p className="text-muted-foreground mt-4">No purchase requests.</p>;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((p: any) => (
        <Card key={p.id} className="glass">
          <CardContent className="py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{p.pkg?.name ?? "Package"} — {pkr(Number(p.amount))}</div>
                <div className="text-xs text-muted-foreground">
                  by {p.profile?.full_name ?? p.profile?.username ?? p.user_id} · {p.payment_method}
                </div>
                {(p.payer_name || p.payer_phone) && (
                  <div className="text-xs mt-1">{p.payer_name} {p.payer_phone && `· ${p.payer_phone}`}</div>
                )}
                {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
              </div>
              <Badge variant={p.status === "approved" ? "default" : p.status === "rejected" ? "destructive" : "secondary"}>{p.status}</Badge>
            </div>
            {p.screenshot_url && (
              <a href={p.screenshot_url} target="_blank" rel="noreferrer" className="block">
                <img src={p.screenshot_url} alt="Payment proof" className="max-h-48 rounded border object-contain bg-muted" />
              </a>
            )}
            {p.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => review(p.id, true)}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => review(p.id, false)}>Reject</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function PlanJoinsQueue() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["plan-joins"],
    queryFn: async () => {
      const { data } = await supabase
        .from("plan_join_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      return data ?? [];
    },
  });
  async function act(id: string, status: string) {
    const { data, error } = await supabase.rpc("update_plan_join_request", { _request_id: id, _status: status });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Updated"); qc.invalidateQueries({ queryKey: ["plan-joins"] }); }
  }
  if (!data?.length) return <p className="text-muted-foreground mt-4">No join requests.</p>;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((r: any) => (
        <Card key={r.id} className="glass">
          <CardContent className="py-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{r.full_name}</div>
                <div className="text-xs text-muted-foreground">{r.email} {r.phone && `· ${r.phone}`}</div>
                {(r.plan_selected || r.country) && (
                  <div className="text-xs mt-1">
                    {r.plan_selected && <span>Plan: {r.plan_selected}</span>}
                    {r.country && <span> · {r.country}</span>}
                  </div>
                )}
                {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
              </div>
              <Badge variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge>
            </div>
            {r.status === "pending" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => act(r.id, "approved")}>Approve</Button>
                <Button size="sm" variant="destructive" onClick={() => act(r.id, "rejected")}>Reject</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* ── Revoke Dialog ───────────────────────────── */
function RevokeDialog({ taskId, onRevoked }: { taskId: string; onRevoked: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  async function revoke() {
    setBusy(true);
    const { data, error } = await supabase.rpc("revoke_task" as any, { _task_id: taskId });
    setBusy(false);
    if (error || !(data as any)?.success) return toast.error((data as any)?.error ?? error?.message ?? "Failed");
    toast.success("Task revoked");
    setOpen(false);
    onRevoked();
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="text-destructive border-destructive/30">Revoke</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Revoke Task</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">This will revoke the task and remove it from the user's active tasks. This cannot be undone.</p>
        <div className="flex gap-2 pt-2">
          <Button variant="destructive" disabled={busy} onClick={revoke}>
            {busy ? "Revoking…" : "Yes, Revoke"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Video Queue ─────────────────────────────── */
function VideoQueue() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["video-task-queue"],
    queryFn: async () => {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("*")
        .eq("task_type", "video")
        .not("status", "eq", "cancelled")
        .order("submitted_at", { ascending: false, nullsFirst: false })
        .limit(100);
      if (!tasks?.length) return [];
      const ids: string[] = [...new Set(tasks.map((t) => t.assigned_to).filter((id): id is string => id !== null && id !== undefined))];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, username").in("id", ids);
      const profMap = new Map((profs ?? []).map((p) => [p.id, p]));
      return tasks.map((t) => ({ ...t, profile: t.assigned_to ? profMap.get(t.assigned_to) : undefined }));
    },
  });

  async function review(id: string, approve: boolean, reason?: string) {
    const { data, error } = await supabase.rpc("review_task", { _task_id: id, _approve: approve, _reason: reason ?? undefined });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success(approve ? "Approved ✓" : "Rejected"); qc.invalidateQueries(); }
  }

  if (isLoading) return <p className="text-muted-foreground mt-4">Loading…</p>;
  if (!data?.length) return <p className="text-muted-foreground mt-4">No video tasks yet.</p>;

  return (
    <div className="space-y-3 mt-4">
      {data.map((t: any) => {
        const proofImages: string[] = Array.isArray(t.proof_files) ? t.proof_files : [];
        const watchSecs = Number(t.total_watch_seconds ?? 0);
        return (
          <Card key={t.id} className="glass">
            <CardHeader>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-base">{t.title}</span>
                    <VideoStatusBadge status={t.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.profile?.full_name ?? t.profile?.username ?? "Unknown user"}
                  </p>
                </div>
                <span className="text-sm font-semibold">{pkr(Number(t.reward))}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Meta row */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                {t.submitted_at && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Submitted {new Date(t.submitted_at).toLocaleString()}
                  </span>
                )}
                {watchSecs > 0 && (
                  <span className="flex items-center gap-1">
                    <Video className="h-3 w-3" /> Watched {Math.floor(watchSecs / 60)}m {watchSecs % 60}s
                  </span>
                )}
              </div>
              {/* Proof text */}
              {t.submission_text && (
                <p className="text-sm bg-muted/40 rounded-xl p-3 leading-relaxed">{t.submission_text}</p>
              )}
              {/* Proof images */}
              {proofImages.length > 0 && (
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <ImageIcon className="h-3 w-3" /> {proofImages.length} screenshot{proofImages.length > 1 ? "s" : ""}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {proofImages.map((f) => (
                      <a key={f} href={f} target="_blank" rel="noreferrer">
                        <img src={f} className="h-28 w-28 rounded-xl border object-cover shadow-sm hover:scale-105 transition-transform" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {/* Actions */}
              {t.status === "submitted" && (
                <div className="flex gap-2 flex-wrap pt-1">
                  <Button size="sm" onClick={() => review(t.id, true)}>Approve</Button>
                  <RejectDialog onConfirm={(r) => review(t.id, false, r)} />
                  <RevokeDialog taskId={t.id} onRevoked={() => qc.invalidateQueries()} />
                </div>
              )}
              {t.status === "rejected" && t.rejection_reason && (
                <p className="text-xs text-destructive">Reason: {t.rejection_reason}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function VideoStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    assigned: "bg-blue-500/10 text-blue-600",
    submitted: "bg-amber-500/10 text-amber-600",
    approved: "bg-emerald-500/10 text-emerald-600",
    rejected: "bg-red-500/10 text-red-600",
    revoked: "bg-muted text-muted-foreground",
  };
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
