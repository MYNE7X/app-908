import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/feature/file-upload";
import { toast } from "sonner";
import { Loader2, Key, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({ meta: [{ title: "Tasks — Expert Solutions" }] }),
  component: TasksPage,
});

function useIsClient() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      return (data ?? []).some((r: any) => r.role === "client");
    },
  });
}

function NoKeyScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="h-20 w-20 rounded-3xl bg-primary/10 grid place-items-center mb-5 shadow-inner">
        <Key className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-bold tracking-tight mb-2">You need a Key to access tasks</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Purchase a plan and redeem your activation key to unlock task assignments and start earning.
      </p>
      <Button asChild>
        <Link to="/packages">
          Buy a Plan <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

function TasksPage() {
  const { data: isClient, isLoading: rolesLoading } = useIsClient();

  if (rolesLoading) return <Loading />;
  if (!isClient) return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Complete tasks and submit proof to earn.</p>
      </div>
      <NoKeyScreen />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tasks</h1>
        <p className="text-muted-foreground mt-1">Complete your assigned tasks and submit proof to earn.</p>
      </div>
      <Tabs defaultValue="mine">
        <TabsList>
          <TabsTrigger value="mine">My tasks</TabsTrigger>
          <TabsTrigger value="open">Open</TabsTrigger>
        </TabsList>
        <TabsContent value="mine"><MyTasks /></TabsContent>
        <TabsContent value="open"><OpenTasks /></TabsContent>
      </Tabs>
    </div>
  );
}

function MyTasks() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-tasks"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("tasks").select("*").eq("assigned_to", u.user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty msg="No tasks assigned to you yet. Check back soon." />;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((t) => <TaskCard key={t.id} task={t} />)}
    </div>
  );
}

function OpenTasks() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["open-tasks"],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_open_tasks");
      return (data as any[]) ?? [];
    },
  });
  async function claim(id: string) {
    const { data, error } = await supabase.rpc("claim_open_task", { _task_id: id });
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Claimed"); qc.invalidateQueries(); }
  }
  if (isLoading) return <Loading />;
  if (!data?.length) return <Empty msg="No open tasks right now." />;
  return (
    <div className="grid gap-3 mt-4">
      {data.map((t) => (
        <Card key={t.id} className="glass">
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">{t.title}</CardTitle>
                <CardDescription>{t.description}</CardDescription>
              </div>
              <Badge variant="secondary">{Number(t.reward).toFixed(2)} {t.currency}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => claim(t.id)}>Claim task</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TaskCard({ task }: { task: any }) {
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{task.title}</CardTitle>
            <CardDescription className="line-clamp-2">{task.description}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <StatusBadge status={task.status} />
            <span className="text-sm font-medium">{Number(task.reward).toFixed(2)} {task.currency}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {(task.status === "assigned" || task.status === "rejected") && <SubmitDialog task={task} />}
        {task.status === "rejected" && task.rejection_reason && (
          <p className="text-sm text-destructive w-full">{task.rejection_reason}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    assigned: "bg-primary/10 text-primary",
    submitted: "bg-warning/10 text-warning",
    approved: "bg-success/10 text-success",
    rejected: "bg-destructive/10 text-destructive",
  };
  return <span className={`text-xs px-2 py-0.5 rounded ${map[status] ?? "bg-muted"}`}>{status}</span>;
}

function SubmitDialog({ task }: { task: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_task_v2", {
      _task_id: task.id, _text: text, _url: url,
      _proof_files: proof ? [proof] : [],
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Submitted"); setOpen(false); qc.invalidateQueries(); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm">Submit proof</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit proof — {task.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Note</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>URL (optional)</Label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <Label>Screenshot</Label>
            <FileUpload bucket="proof-uploads" pathPrefix={`${task.assigned_to}/${task.id}`} value={proof} onChange={setProof} />
          </div>
          <Button onClick={submit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Loading() { return <div className="py-8 text-center text-muted-foreground">Loading…</div>; }
function Empty({ msg }: { msg: string }) { return <Card className="glass mt-4"><CardContent className="py-10 text-center text-muted-foreground">{msg}</CardContent></Card>; }
