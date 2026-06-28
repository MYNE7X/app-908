import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Crown, Send, Key, Mail, Search, Check, Loader2, MessageCircle, X, CheckCheck, Clock, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/super-admin")({
  head: () => ({ meta: [{ title: "Super Admin — Expert Solutions" }] }),
  component: SuperAdminPage,
});

function pkr(val: number) {
  return `₨${val.toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;
}

function SuperAdminPage() {
  const { data: stats } = useQuery({
    queryKey: ["super-stats"],
    queryFn: async () => { const { data } = await supabase.rpc("get_superadmin_stats"); return data as any; },
  });
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 grid place-items-center shadow-lg">
          <Crown className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Super Admin</h1>
          <p className="text-muted-foreground text-sm">Platform controls, role management and task creation.</p>
        </div>
      </div>

      {stats && !stats.error && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Users" value={stats.total_users} color="from-blue-500/20 to-blue-500/5" />
          <Stat label="Clients" value={stats.total_clients} color="from-emerald-500/20 to-emerald-500/5" />
          <Stat label="Admins" value={stats.total_admins} color="from-violet-500/20 to-violet-500/5" />
          <Stat label="Tasks" value={stats.total_tasks} color="from-amber-500/20 to-amber-500/5" />
          <Stat label="Submitted" value={stats.tasks_submitted} color="from-cyan-500/20 to-cyan-500/5" />
          <Stat label="Approved" value={stats.tasks_approved} color="from-green-500/20 to-green-500/5" />
          <Stat label="Earned" value={pkr(Number(stats.total_earned ?? 0))} color="from-emerald-500/20 to-emerald-500/5" />
          <Stat label="Withdrawn" value={pkr(Number(stats.total_withdrawn ?? 0))} color="from-rose-500/20 to-rose-500/5" />
        </div>
      )}

      <Tabs defaultValue="keys">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="keys">
            <Key className="h-3.5 w-3.5 mr-1.5" /> Activation Keys
          </TabsTrigger>
          <TabsTrigger value="bulk">Bulk assign</TabsTrigger>
          <TabsTrigger value="users">Users & roles</TabsTrigger>
          <TabsTrigger value="fake">Fake reviews</TabsTrigger>
          <TabsTrigger value="support" className="relative">
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Support
            <SupportUnreadBadge />
          </TabsTrigger>
        </TabsList>
        <TabsContent value="keys"><ActivationKeysPanel /></TabsContent>
        <TabsContent value="bulk"><BulkAssign /></TabsContent>
        <TabsContent value="users"><UserList /></TabsContent>
        <TabsContent value="fake"><FakeReviews /></TabsContent>
        <TabsContent value="support"><SupportPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <Card className={`glass bg-gradient-to-br ${color}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}

/* ── Activation Keys Panel ──────────────────────────── */
function ActivationKeysPanel() {
  const qc = useQueryClient();
  const [newKey, setNewKey] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [selectedPkgId, setSelectedPkgId] = useState("");
  const [creating, setCreating] = useState(false);

  const { data: keys } = useQuery({
    queryKey: ["activation-keys"],
    queryFn: async () => {
      const { data } = await supabase
        .from("activation_keys")
        .select("*, packages(name)")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["packages-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("packages").select("id, name").eq("is_active", true).order("sort_order");
      return data ?? [];
    },
  });

  async function generateKey() {
    if (!selectedPkgId) return toast.error("Select a package first");
    const key = newKey.trim() || `KEY-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    setCreating(true);
    const { error } = await supabase.from("activation_keys").insert({
      key,
      package_id: selectedPkgId,
      notes: newNotes || null,
      is_active: true,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Activation key created!", { description: key });
    setNewKey(""); setNewNotes("");
    qc.invalidateQueries({ queryKey: ["activation-keys"] });
  }

  return (
    <div className="space-y-5 mt-4">
      {/* Create key card */}
      <Card className="glass border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> Generate Activation Key
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Package</Label>
              <select
                value={selectedPkgId}
                onChange={(e) => setSelectedPkgId(e.target.value)}
                className="w-full mt-1 rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">— Select package —</option>
                {(packages ?? []).map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Custom Key (leave blank to auto-generate)</Label>
              <Input
                className="mt-1 font-mono text-sm"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                placeholder="KEY-XXXX-XXXX"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Input className="mt-1 text-sm" value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="e.g. for Ahmed Khan" />
          </div>
          <Button onClick={generateKey} disabled={creating} className="gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
            Generate Key
          </Button>
        </CardContent>
      </Card>

      {/* Keys list */}
      <div className="space-y-2">
        {(keys ?? []).map((k: any) => (
          <KeyRow key={k.id} keyRow={k} packages={packages ?? []} onRefresh={() => qc.invalidateQueries({ queryKey: ["activation-keys"] })} />
        ))}
        {!keys?.length && <p className="text-muted-foreground text-sm py-4">No activation keys yet.</p>}
      </div>
    </div>
  );
}

function KeyRow({ keyRow, packages, onRefresh }: { keyRow: any; packages: any[]; onRefresh: () => void }) {
  const [sendOpen, setSendOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [ipBlocked, setIpBlocked] = useState(false);
  const [noSender, setNoSender] = useState(false);
  const [sentFrom, setSentFrom] = useState("");

  const pkgName = keyRow.packages?.name ?? packages.find((p: any) => p.id === keyRow.package_id)?.name ?? "Package";

  const { data: senderInfo } = useQuery({
    queryKey: ["brevo-sender"],
    queryFn: async () => {
      const res = await fetch("/api/brevo-senders");
      const d = await res.json();
      return res.ok ? d : null;
    },
    staleTime: 60_000,
  });

  async function sendEmail() {
    if (!email.trim()) return toast.error("Enter recipient email");
    setSending(true);
    setIpBlocked(false);
    setNoSender(false);
    try {
      const res = await fetch("/api/send-activation-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: email.trim(),
          toName: name.trim() || undefined,
          activationKey: keyRow.key,
          packageName: pkgName,
        }),
      });
      const data = await res.json();
      if (res.status === 403 && data.error === "IP_NOT_AUTHORIZED") {
        setIpBlocked(true);
        return;
      }
      if (res.status === 422 && data.error === "NO_VERIFIED_SENDER") {
        setNoSender(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setSentFrom(data.sentFrom || "");
      toast.success("Email sent! ✉️", { description: `Key delivered to ${email}` });
      setSent(true);
      setSendOpen(false);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message ?? "Email failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className={`glass ${keyRow.used_by ? "opacity-60" : ""}`}>
      <CardContent className="py-3 flex flex-wrap items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
          <Key className="h-4 w-4 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-mono text-sm font-bold">{keyRow.key}</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap">
            <span>{pkgName}</span>
            {keyRow.notes && <span>· {keyRow.notes}</span>}
            {keyRow.used_by && <span className="text-amber-600">· Used {keyRow.used_at ? new Date(keyRow.used_at).toLocaleDateString() : ""}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={keyRow.used_by ? "secondary" : "default"} className={keyRow.used_by ? "" : "bg-emerald-500/20 text-emerald-600 border-0"}>
            {keyRow.used_by ? "Used" : "Active"}
          </Badge>

          {!keyRow.used_by && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-8"
                onClick={() => { navigator.clipboard.writeText(keyRow.key); toast.success("Key copied!"); }}
              >
                Copy
              </Button>

              <Dialog open={sendOpen} onOpenChange={setSendOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 h-8 bg-primary/90 hover:bg-primary">
                    <Send className="h-3.5 w-3.5" /> Email Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md rounded-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-primary" /> Send Activation Key
                    </DialogTitle>
                  </DialogHeader>

                  {/* Key preview */}
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-center">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Key to be sent</div>
                    <div className="font-mono text-lg font-black tracking-widest">{keyRow.key}</div>
                    <div className="text-xs text-muted-foreground mt-1">{pkgName}</div>
                  </div>

                  {/* Sender info pill — shows which verified email will send */}
                  {senderInfo?.sender && !ipBlocked && !noSender && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs">
                      <span className="text-emerald-500">✓</span>
                      <span className="text-muted-foreground">Sending from:</span>
                      <span className="font-mono font-semibold text-foreground truncate">{senderInfo.sender.email}</span>
                    </div>
                  )}

                  {/* No verified sender error */}
                  {noSender && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-rose-500 text-base leading-none mt-0.5">✗</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">No verified sender email</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Brevo requires a verified sender address. Add and verify one in your Brevo account.
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://app.brevo.com/senders"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold py-2.5 transition-colors"
                      >
                        📧 Open Brevo → Add Verified Sender
                      </a>
                      <p className="text-[11px] text-center text-muted-foreground">After verifying, reload and try again.</p>
                    </div>
                  )}

                  {/* IP blocked warning banner */}
                  {ipBlocked && (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-500 text-base leading-none mt-0.5">⚠️</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">Brevo IP not authorized</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Brevo is blocking this server's IP address. You must authorize it once in your Brevo security settings.
                          </p>
                        </div>
                      </div>
                      <a
                        href="https://app.brevo.com/security/authorised_ips"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full rounded-lg bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold py-2.5 transition-colors"
                      >
                        <span>🔓</span> Open Brevo → Authorize IP
                      </a>
                      <p className="text-[11px] text-center text-muted-foreground">
                        After authorizing, come back and click Send Email again.
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Recipient Name</Label>
                      <Input
                        className="mt-1"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ahmed Khan"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Recipient Email *</Label>
                      <Input
                        className="mt-1"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="ahmed@example.com"
                      />
                    </div>
                    <Button
                      onClick={sendEmail}
                      disabled={sending || !email.trim()}
                      className="w-full gap-2"
                    >
                      {sending
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                        : sent
                        ? <><Check className="h-4 w-4" /> Sent!</>
                        : <><Send className="h-4 w-4" /> Send Email</>
                      }
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      A beautifully designed email with step-by-step redemption instructions will be sent.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ── Bulk Assign ──────────────────────────────────── */
function BulkAssign() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("80");
  const [videoLinks, setVideoLinks] = useState("");
  const [taskType, setTaskType] = useState("general");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const { data: users } = useQuery({
    queryKey: ["assign-users"],
    queryFn: async () => { const { data } = await supabase.rpc("get_users_for_assignment", { _limit: 500 }); return (data as any[]) ?? []; },
  });

  async function assign() {
    if (!title || selectedIds.size === 0) return toast.error("Title + users required");
    setSaving(true);
    const { data, error } = await supabase.rpc("bulk_assign_task", {
      _title: title, _description: description, _instructions: "",
      _task_type: taskType, _reward: parseFloat(reward) || 0, _currency: "PKR",
      _video_links: videoLinks.split("\n").map((s) => s.trim()).filter(Boolean),
      _thumbnail_url: undefined, _auto_approve: false,
      _user_ids: Array.from(selectedIds),
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else {
      toast.success(`Assigned to ${(data as any).assigned} users! 🎯`);
      setTitle(""); setDescription(""); setSelectedIds(new Set());
    }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 mt-4">
      <Card className="glass">
        <CardHeader><CardTitle>Task details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Reward (PKR)</Label><Input type="number" value={reward} onChange={(e) => setReward(e.target.value)} /></div>
            <div><Label>Type</Label><Input value={taskType} onChange={(e) => setTaskType(e.target.value)} placeholder="general / video" /></div>
          </div>
          <div><Label>Video links (one per line)</Label><Textarea value={videoLinks} onChange={(e) => setVideoLinks(e.target.value)} rows={3} /></div>
          <Button onClick={assign} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Assign to {selectedIds.size} users
          </Button>
        </CardContent>
      </Card>
      <Card className="glass">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Pick users</CardTitle>
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] overflow-y-auto space-y-1">
            {(users ?? []).map((u: any) => (
              <label key={u.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted cursor-pointer">
                <Checkbox checked={selectedIds.has(u.id)} onCheckedChange={(v) => {
                  setSelectedIds((s) => { const n = new Set(s); v ? n.add(u.id) : n.delete(u.id); return n; });
                }} />
                <Avatar className="h-6 w-6"><AvatarImage src={u.avatar_url} /><AvatarFallback>{(u.full_name ?? "U")[0]}</AvatarFallback></Avatar>
                <span className="text-sm truncate flex-1">{u.full_name ?? u.username ?? u.email}</span>
                <span className="text-xs text-muted-foreground">{u.completed_tasks ?? 0} done</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── User List ──────────────────────────────────── */
function UserList() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState("");
  const { data } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => { const { data } = await supabase.rpc("get_admin_user_list"); return (data as any[]) ?? []; },
  });
  const filtered = useMemo(() => (data ?? []).filter((u) =>
    !filter || `${u.full_name} ${u.username} ${u.email}`.toLowerCase().includes(filter.toLowerCase())
  ), [data, filter]);

  async function toggleRole(uid: string, role: "admin" | "super_admin" | "client", enabled: boolean) {
    const { data, error } = await supabase.rpc("set_user_role", { _user_id: uid, _role: role, _enabled: enabled });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); }
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search users…" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="space-y-2">
        {filtered.map((u: any) => {
          const roles: string[] = u.roles ?? [];
          return (
            <Card key={u.id} className="glass">
              <CardContent className="py-3 flex flex-wrap items-center gap-3">
                <Avatar><AvatarImage src={u.avatar_url} /><AvatarFallback>{(u.full_name ?? "U")[0]}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{u.full_name ?? u.username}</div>
                  <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {(["client", "admin", "super_admin"] as const).map((r) => (
                    <label key={r} className="flex items-center gap-1.5 text-xs cursor-pointer">
                      <Checkbox checked={roles.includes(r)} onCheckedChange={(v) => toggleRole(u.id, r, !!v)} />
                      <span className="capitalize">{r.replace("_", " ")}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ── Support Chat Panel ─────────────────────────── */
function SupportUnreadBadge() {
  const { data: chats } = useQuery({
    queryKey: ["admin-support-chats-unread"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_chats")
        .select("id")
        .eq("status", "open");
      return data ?? [];
    },
    refetchInterval: 15000,
  });
  if (!chats?.length) return null;
  return (
    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center">
      {chats.length > 9 ? "9+" : chats.length}
    </span>
  );
}

function timeAgo(ts: string) {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function SupportPanel() {
  const qc = useQueryClient();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "closed">("open");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: chats, error: chatsError } = useQuery({
    queryKey: ["admin-support-chats", filter],
    queryFn: async () => {
      let q = supabase
        .from("support_chats")
        .select("*, profiles(full_name, avatar_url)")
        .order("updated_at", { ascending: false });
      if (filter !== "all") q = q.eq("status", filter);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 8000,
    retry: 1,
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-support-msgs", selectedChatId],
    enabled: !!selectedChatId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("*")
        .eq("chat_id", selectedChatId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 4000,
    retry: 1,
  });

  const selectedChat = chats?.find((c: any) => c.id === selectedChatId);

  useEffect(() => {
    if (!selectedChatId) return;
    const ch = supabase
      .channel(`admin-msgs-${selectedChatId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "support_messages",
        filter: `chat_id=eq.${selectedChatId}`,
      }, () => qc.invalidateQueries({ queryKey: ["admin-support-msgs", selectedChatId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedChatId, qc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  async function sendReply() {
    if (!reply.trim() || !selectedChatId || !selectedChat) return;
    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSending(false); return; }

    const { error } = await supabase.from("support_messages").insert({
      chat_id: selectedChatId,
      sender_id: user.id,
      is_admin: true,
      body: reply.trim(),
    });
    if (error) { toast.error(error.message); setSending(false); return; }

    await supabase.from("notifications").insert({
      user_id: selectedChat.user_id,
      title: "Support reply",
      body: reply.trim().slice(0, 100),
      type: "support_reply",
    });

    setReply("");
    setSending(false);
    qc.invalidateQueries({ queryKey: ["admin-support-msgs", selectedChatId] });
    toast.success("Reply sent");
  }

  async function toggleChatStatus() {
    if (!selectedChatId || !selectedChat) return;
    const newStatus = selectedChat.status === "open" ? "closed" : "open";
    await supabase.from("support_chats").update({
      status: newStatus,
      closed_at: newStatus === "closed" ? new Date().toISOString() : null,
    }).eq("id", selectedChatId);
    toast.success(newStatus === "closed" ? "Chat closed" : "Chat reopened");
    qc.invalidateQueries({ queryKey: ["admin-support-chats", filter] });
    qc.invalidateQueries({ queryKey: ["admin-support-chats-unread"] });
  }

  function selectChat(id: string) {
    setSelectedChatId(id);
    setMobileView("detail");
  }

  const unreadPerChat = (chatId: string) => {
    if (chatId !== selectedChatId) return 0;
    return (messages ?? []).filter((m: any) => !m.is_admin && !m.read_at).length;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 grid place-items-center">
          <MessageCircle className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-base">Support Chats</h2>
          <p className="text-xs text-muted-foreground">Reply to member support requests in real time</p>
        </div>
      </div>

      {chatsError && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">⚠️ Support tables not set up yet</p>
          <p className="text-xs text-muted-foreground">
            Run <code className="bg-muted px-1 py-0.5 rounded font-mono">support_chat_migration.sql</code> in your Supabase SQL Editor to enable the chat system.
          </p>
          <p className="text-xs text-muted-foreground font-mono break-all opacity-70">{String((chatsError as any)?.message ?? chatsError)}</p>
        </div>
      )}

      <div className="border rounded-2xl overflow-hidden bg-card" style={{ height: 560 }}>
        <div className="flex" style={{ height: 560 }}>

          {/* ── LEFT: Chat list ───────────────────────────── */}
          <div className={cn(
            "w-full lg:w-72 shrink-0 border-r flex flex-col overflow-hidden",
            mobileView === "detail" ? "hidden lg:flex" : "flex",
          )}>
            {/* Filter tabs */}
            <div className="flex border-b text-xs font-medium shrink-0">
              {(["open", "closed", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "flex-1 py-2.5 capitalize transition-colors",
                    filter === f ? "bg-primary/10 text-primary border-b-2 border-primary" : "text-muted-foreground hover:bg-muted/50",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Chat items */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {(!chats || chats.length === 0) && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  No {filter} chats
                </div>
              )}
              {(chats ?? []).map((chat: any) => {
                const name = chat.profiles?.full_name ?? "Member";
                const isActive = chat.id === selectedChatId;
                const unread = unreadPerChat(chat.id);
                return (
                  <button
                    key={chat.id}
                    onClick={() => selectChat(chat.id)}
                    className={cn(
                      "w-full text-left px-3 py-3 border-b transition-colors flex items-start gap-2.5",
                      isActive ? "bg-primary/8" : "hover:bg-muted/40",
                    )}
                  >
                    <Avatar className="h-9 w-9 shrink-0 mt-0.5">
                      <AvatarImage src={chat.profiles?.avatar_url} />
                      <AvatarFallback className="text-xs bg-violet-100 text-violet-700 font-bold">
                        {name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate flex-1">{name}</span>
                        {unread > 0 && (
                          <span className="h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-bold grid place-items-center shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{chat.subject}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full shrink-0",
                          chat.status === "open" ? "bg-emerald-500" : "bg-muted-foreground/40",
                        )} />
                        <span className="text-[10px] text-muted-foreground">{chat.status} · {timeAgo(chat.updated_at)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── RIGHT: Chat detail ───────────────────────── */}
          <div className={cn(
            "flex-1 flex flex-col min-w-0 overflow-hidden",
            mobileView === "list" ? "hidden lg:flex" : "flex",
          )}>
            {!selectedChat ? (
              <div className="flex-1 flex items-center justify-center text-center p-8 text-sm text-muted-foreground">
                <div>
                  <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  Select a chat to view and reply
                </div>
              </div>
            ) : (
              <>
                {/* Detail header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-muted/20">
                  <button
                    onClick={() => setMobileView("list")}
                    className="lg:hidden h-8 w-8 rounded-xl hover:bg-muted grid place-items-center"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={selectedChat.profiles?.avatar_url} />
                    <AvatarFallback className="text-xs bg-violet-100 text-violet-700 font-bold">
                      {(selectedChat.profiles?.full_name ?? "M")[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold truncate">{selectedChat.profiles?.full_name ?? "Member"}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{selectedChat.subject}</div>
                  </div>
                  <Badge
                    variant={selectedChat.status === "open" ? "default" : "secondary"}
                    className={cn("text-[10px] shrink-0", selectedChat.status === "open" && "bg-emerald-500/20 text-emerald-700 border-0")}
                  >
                    {selectedChat.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant={selectedChat.status === "open" ? "destructive" : "outline"}
                    className="h-7 text-xs shrink-0"
                    onClick={toggleChatStatus}
                  >
                    {selectedChat.status === "open" ? (
                      <><X className="h-3 w-3 mr-1" /> End</>
                    ) : (
                      "Reopen"
                    )}
                  </Button>
                </div>

                {/* Messages */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 flex flex-col">
                  {(!messages || messages.length === 0) && (
                    <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                      <div className="text-center">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        No messages yet
                      </div>
                    </div>
                  )}
                  {(messages ?? []).map((msg: any) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-2 max-w-[80%]",
                        msg.is_admin ? "self-end ml-auto flex-row-reverse" : "self-start",
                      )}
                    >
                      <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                        <AvatarFallback className={cn(
                          "text-[10px] font-bold",
                          msg.is_admin ? "bg-violet-100 text-violet-700" : "bg-muted text-muted-foreground",
                        )}>
                          {msg.is_admin ? "ES" : (selectedChat.profiles?.full_name ?? "U")[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className={cn(
                        "px-3 py-2 rounded-2xl text-sm leading-relaxed",
                        msg.is_admin
                          ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                          : "bg-muted rounded-tl-sm",
                      )}>
                        <p className="break-words">{msg.body}</p>
                        <div className={cn("flex items-center gap-1 mt-1", msg.is_admin ? "justify-end" : "justify-start")}>
                          <span className={cn("text-[10px]", msg.is_admin ? "text-white/60" : "text-muted-foreground")}>
                            {timeAgo(msg.created_at)}
                          </span>
                          {msg.is_admin && msg.read_at && (
                            <CheckCheck className="h-3 w-3 text-white/60" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Reply input */}
                {selectedChat.status === "open" ? (
                  <div className="flex gap-2 p-3 border-t shrink-0 bg-background">
                    <Textarea
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="Type your reply…"
                      className="resize-none text-sm min-h-[40px] max-h-[120px]"
                      rows={1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="h-10 w-10 shrink-0 bg-gradient-to-br from-violet-600 to-indigo-600"
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                ) : (
                  <div className="p-3 border-t text-center text-xs text-muted-foreground bg-muted/20">
                    This chat is closed. Reopen it to send a reply.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Fake Reviews ──────────────────────────────── */
function FakeReviews() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const { data } = useQuery({
    queryKey: ["fake-reviews-all"],
    queryFn: async () => { const { data } = await supabase.from("fake_reviews").select("*").order("sort_order"); return data ?? []; },
  });
  async function create() {
    const { data, error } = await supabase.rpc("upsert_fake_review", {
      _name: name, _avatar: "", _location: "Pakistan", _rating: rating, _content: content, _visible: true, _order: 0,
    });
    if (error || !(data as any)?.success) toast.error(error?.message ?? "Failed");
    else { toast.success("Review saved!"); setName(""); setContent(""); qc.invalidateQueries(); }
  }
  return (
    <div className="grid lg:grid-cols-2 gap-4 mt-4">
      <Card className="glass">
        <CardHeader><CardTitle>Add review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Rating (1–5)</Label><Input type="number" min={1} max={5} value={rating} onChange={(e) => setRating(parseInt(e.target.value) || 5)} /></div>
          <div><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} /></div>
          <Button onClick={create}>Save</Button>
        </CardContent>
      </Card>
      <Card className="glass">
        <CardHeader><CardTitle>Existing ({data?.length ?? 0})</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {(data ?? []).map((r: any) => (
              <div key={r.id} className="border rounded-xl p-2.5 text-sm">
                <div className="font-medium">{r.reviewer_name} · {"★".repeat(r.rating)}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.content}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
