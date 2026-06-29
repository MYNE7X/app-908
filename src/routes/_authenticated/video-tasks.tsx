import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileUpload } from "@/components/feature/file-upload";
import { SecureVideoPlayer } from "@/components/feature/secure-video-player";
import { toast } from "sonner";
import { Loader2, CheckCircle2, Key, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/video-tasks")({
  head: () => ({ meta: [{ title: "Video Tasks — Expert Solutions" }] }),
  component: VideoTasksPage,
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
      <h2 className="text-xl font-bold tracking-tight mb-2">You need a Key to access video tasks</h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6">
        Purchase a plan and redeem your activation key to unlock video task assignments and start earning.
      </p>
      <Button asChild>
        <Link to="/packages">
          Buy a Plan <ArrowRight className="h-4 w-4 ml-2" />
        </Link>
      </Button>
    </div>
  );
}

function VideoTasksPage() {
  const { data: isClient, isLoading: rolesLoading } = useIsClient();

  const { data, isLoading } = useQuery({
    queryKey: ["video-tasks"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("tasks").select("*")
        .eq("assigned_to", u.user.id)
        .eq("task_type", "video")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!isClient,
  });

  if (rolesLoading) return (
    <div className="space-y-4">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
      <div className="py-8 text-center text-muted-foreground">Loading…</div>
    </div>
  );

  if (!isClient) return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
        <p className="text-muted-foreground mt-1">Watch videos to earn rewards.</p>
      </div>
      <NoKeyScreen />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Video Tasks</h1>
        <p className="text-muted-foreground mt-1">Watch the required videos to unlock the proof submission.</p>
      </div>
      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Loading…</div>
      ) : !data?.length ? (
        <Card className="glass">
          <CardContent className="py-10 text-center text-muted-foreground">
            No video tasks assigned to you yet. Check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {data.map((t) => <VideoTaskCard key={t.id} task={t} />)}
        </div>
      )}
    </div>
  );
}

function VideoTaskCard({ task }: { task: any }) {
  const videos: string[] = Array.isArray(task.video_links) ? task.video_links : [];
  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
          <Badge variant="secondary">{Number(task.reward).toFixed(2)} {task.currency}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <VideoTaskBody task={task} videos={videos} />
      </CardContent>
    </Card>
  );
}

function VideoTaskBody({ task, videos }: { task: any; videos: string[] }) {
  const qc = useQueryClient();
  const { data: progress } = useQuery({
    queryKey: ["video-progress", task.id],
    queryFn: async () => {
      const { data } = await supabase.rpc("get_video_watch_progress", { _task_id: task.id });
      return data as { watched: string[]; total: number };
    },
  });
  const watched = new Set(progress?.watched ?? []);
  const allWatched = videos.length > 0 && videos.every((v) => watched.has(v));

  async function markWatched(url: string) {
    await supabase.rpc("mark_video_watched", { _task_id: task.id, _video_url: url });
    qc.invalidateQueries({ queryKey: ["video-progress", task.id] });
  }

  return (
    <div className="space-y-3">
      {videos.map((url, i) => (
        <div key={url} className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            {watched.has(url)
              ? <CheckCircle2 className="h-4 w-4 text-green-500" />
              : <span className="h-4 w-4 rounded-full border-2 border-muted-foreground inline-block" />
            }
            Video {i + 1}
          </div>
          <SecureVideoPlayer
            src={url}
            onComplete={() => markWatched(url)}
          />
        </div>
      ))}
      {allWatched && task.status !== "submitted" && task.status !== "approved" && (
        <SubmitDialog task={task} />
      )}
      {task.status === "submitted" && (
        <p className="text-sm text-muted-foreground">Proof submitted — awaiting review.</p>
      )}
      {task.status === "approved" && (
        <p className="text-sm text-green-600 font-medium flex items-center gap-1">
          <CheckCircle2 className="h-4 w-4" /> Approved — reward credited.
        </p>
      )}
    </div>
  );
}

function SubmitDialog({ task }: { task: any }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [proof, setProof] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    const { data, error } = await supabase.rpc("submit_task_v2", {
      _task_id: task.id, _text: text, _url: "",
      _proof_files: proof ? [proof] : [],
    });
    setSaving(false);
    if (error || !(data as any)?.success) toast.error((data as any)?.error ?? error?.message ?? "Failed");
    else { toast.success("Submitted!"); setOpen(false); qc.invalidateQueries(); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">Submit proof</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Submit proof — {task.title}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Note (optional)</Label>
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} />
          </div>
          <div>
            <Label>Screenshot</Label>
            <FileUpload bucket="proof-uploads" pathPrefix={`${task.assigned_to}/${task.id}`} value={proof} onChange={setProof} />
          </div>
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
