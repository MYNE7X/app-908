import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, MapPin, ShieldCheck, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Expert Solutions" }] }),
  component: ReviewsPage,
});

type Item = {
  id: string;
  name: string;
  location?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  created_at: string;
  status?: string;
  isMine?: boolean;
  avatarUrl?: string | null;
};

function initials(name?: string | null) {
  if (!name) return "U";
  return name.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

// Deterministic colorful gradient per name (so each reviewer looks unique).
const AVATAR_GRADIENTS = [
  ["#f97316", "#ea580c"],
  ["#3b82f6", "#1d4ed8"],
  ["#10b981", "#047857"],
  ["#a855f7", "#7e22ce"],
  ["#ec4899", "#be185d"],
  ["#06b6d4", "#0e7490"],
  ["#f59e0b", "#b45309"],
  ["#ef4444", "#b91c1c"],
  ["#14b8a6", "#0f766e"],
  ["#6366f1", "#4338ca"],
  ["#84cc16", "#4d7c0f"],
  ["#d946ef", "#a21caf"],
];
function gradientFor(name?: string | null) {
  const s = name || "U";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[h % AVATAR_GRADIENTS.length];
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 86400 * 30) return `${Math.floor(d / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function ReviewsPage() {
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<"all" | "5" | "4" | "mine">("all");

  const { data: real } = useQuery({
    queryKey: ["reviews-approved"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, title, content, created_at, status, reviewer_id")
        .or(uid ? `status.eq.approved,reviewer_id.eq.${uid}` : "status.eq.approved")
        .order("created_at", { ascending: false })
        .limit(200);
      return { rows: data ?? [], uid };
    },
  });

  const { data: profilesById } = useQuery({
    queryKey: ["review-profiles", real?.rows?.map((r) => r.reviewer_id).join(",")],
    enabled: !!real?.rows?.length,
    queryFn: async () => {
      const ids = Array.from(new Set((real?.rows ?? []).map((r: any) => r.reviewer_id))).filter(Boolean);
      if (!ids.length) return {} as Record<string, any>;
      const { data } = await supabase.from("profiles").select("id, full_name, username, city, country, avatar_url").in("id", ids);
      const m: Record<string, any> = {};
      (data ?? []).forEach((p: any) => (m[p.id] = p));
      return m;
    },
  });

  const { data: fakes } = useQuery({
    queryKey: ["fake-reviews"],
    queryFn: async () => {
      const { data } = await supabase
        .from("fake_reviews")
        .select("id, reviewer_name, reviewer_location, rating, content, created_at")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
        .limit(500);
      return data ?? [];
    },
  });

  const items: Item[] = useMemo(() => {
    const uid = real?.uid;
    const a: Item[] = (real?.rows ?? []).map((r: any) => {
      const p = profilesById?.[r.reviewer_id];
      return {
        id: `r-${r.id}`,
        name: p?.full_name || p?.username || "Member",
        location: [p?.city, p?.country].filter(Boolean).join(", ") || null,
        rating: r.rating,
        title: r.title,
        content: r.content,
        created_at: r.created_at,
        status: r.status,
        isMine: uid === r.reviewer_id,
        avatarUrl: p?.avatar_url ?? null,
      };
    });
    const b: Item[] = (fakes ?? []).map((f: any) => ({
      id: `f-${f.id}`,
      name: f.reviewer_name,
      location: f.reviewer_location,
      rating: f.rating,
      content: f.content,
      created_at: f.created_at,
      status: "approved",
      avatarUrl: null,
    }));
    return [...a, ...b];
  }, [real, fakes, profilesById]);

  const filtered = items.filter((i) => {
    if (filter === "mine") return i.isMine;
    if (filter === "5") return i.rating === 5;
    if (filter === "4") return i.rating === 4;
    return true;
  });

  const avg = items.length ? (items.reduce((s, i) => s + i.rating, 0) / items.length).toFixed(1) : "0.0";

  async function submit() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return toast.error("Sign in first");
    if (!content.trim()) return toast.error("Please write your review");
    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: u.user.id, reviewee_id: u.user.id, rating, title, content, image_urls: [], status: "pending",
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Submitted! Super admin will review and publish it."); setTitle(""); setContent(""); qc.invalidateQueries(); }
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Hero summary */}
      <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 text-primary-foreground"
           style={{ background: "var(--gradient-hero, linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.7)))" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold leading-tight">Community Reviews</h1>
            <p className="text-xs sm:text-sm opacity-90 mt-1 flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Verified · Moderated by super admin</p>
          </div>
          <div className="text-right">
            <div className="text-3xl sm:text-4xl font-extrabold">{avg}</div>
            <div className="flex justify-end">{Array.from({length:5}).map((_,i)=>(
              <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(Number(avg)) ? "fill-yellow-300 text-yellow-300" : "text-white/40"}`} />
            ))}</div>
            <div className="text-[11px] opacity-90 mt-0.5">{items.length} reviews</div>
          </div>
        </div>
      </div>

      {/* Write review */}
      <Card className="glass">
        <CardHeader className="pb-3"><CardTitle className="text-base sm:text-lg">Write a review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Your rating</Label>
            <div className="flex gap-1 mt-1.5">
              {[1,2,3,4,5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`} className="p-1 -m-1">
                  <Star className={`h-7 w-7 transition-transform ${n <= rating ? "fill-yellow-400 text-yellow-400 scale-110" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
          </div>
          <div><Label className="text-xs">Title (optional)</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Summarize your experience" /></div>
          <div><Label className="text-xs">Your review</Label><Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Tell us about your experience…" /></div>
          <Button onClick={submit} disabled={saving} className="w-full sm:w-auto">{saving ? "Submitting…" : "Submit for approval"}</Button>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Reviews are published after super admin approval.</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto -mx-1 px-1 no-scrollbar">
        {[
          { k: "all", l: "All" },
          { k: "5", l: "5 ★" },
          { k: "4", l: "4 ★" },
          { k: "mine", l: "Mine" },
        ].map((f) => (
          <button key={f.k} onClick={() => setFilter(f.k as any)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
              filter === f.k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
            }`}>
            {f.l}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-muted-foreground shrink-0">{filtered.length} shown</span>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {!filtered.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No reviews yet.</p>
        ) : filtered.map((r) => (
          <Card key={r.id} className="glass overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
              {(() => {
                const [c1, c2] = gradientFor(r.name);
                return (
                  <div className="h-11 w-11 rounded-full shrink-0 ring-2 ring-background shadow-md overflow-hidden flex items-center justify-center text-sm font-bold text-white"
                       style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {r.avatarUrl ? (
                      <img src={r.avatarUrl} alt={r.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <span className="drop-shadow-sm">{initials(r.name)}</span>
                    )}
                  </div>
                );
              })()}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate">{r.name}</div>
                      {r.location && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                          <MapPin className="h-3 w-3" /> {r.location}
                        </div>
                      )}
                    </div>
                    {r.status && r.status !== "approved" ? (
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0">
                        {r.status}
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo(r.created_at)}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/40"}`} />
                    ))}
                  </div>
                  {r.title && <div className="font-medium text-sm mt-1.5">{r.title}</div>}
                  {r.content && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.content}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
