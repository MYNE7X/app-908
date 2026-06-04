import { useEffect, useRef, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Youtube } from "lucide-react";

interface Props {
  src: string;
  minWatchSeconds?: number;
  onComplete?: () => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
    __ytApiLoading?: boolean;
    __ytApiReady?: boolean;
    __ytApiQueue?: Array<() => void>;
  }
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve();
    if (window.__ytApiReady && window.YT?.Player) return resolve();
    window.__ytApiQueue = window.__ytApiQueue ?? [];
    window.__ytApiQueue.push(resolve);
    if (window.__ytApiLoading) return;
    window.__ytApiLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      window.__ytApiReady = true;
      (window.__ytApiQueue ?? []).forEach((cb) => cb());
      window.__ytApiQueue = [];
      if (typeof prev === "function") prev();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    document.head.appendChild(s);
  });
}

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.replace(/^\//, "").split(/[?&#]/)[0] || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const m = u.pathname.match(/^\/(?:embed|shorts|v)\/([^/?#]+)/);
      if (m) return m[1];
    }
  } catch {
    const m = url.match(/[?&]v=([^&#]+)/);
    if (m) return m[1];
  }
  return null;
}

export function SecureVideoPlayer({ src, minWatchSeconds = 0, onComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const watchedRef = useRef(0);
  const tickRef = useRef<number | null>(null);
  const [watched, setWatched] = useState(0);
  const [duration, setDuration] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const videoId = extractYouTubeId(src);

  useEffect(() => {
    if (!videoId || !containerRef.current) {
      if (!videoId) setError("Invalid YouTube link");
      return;
    }
    let destroyed = false;

    loadYouTubeApi().then(() => {
      if (destroyed || !containerRef.current) return;
      const node = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(node);

      playerRef.current = new window.YT.Player(node, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          // hide controls, skip/forward, related videos, keyboard skip, etc.
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          fs: 0,
          iv_load_policy: 3,
          playsinline: 1,
          showinfo: 0,
        },
        events: {
          onReady: (e: any) => {
            try {
              setDuration(e.target.getDuration() || 0);
            } catch {}
          },
          onStateChange: (e: any) => {
            // 1 = playing
            if (e.data === 1) {
              if (tickRef.current) window.clearInterval(tickRef.current);
              tickRef.current = window.setInterval(() => {
                watchedRef.current += 1;
                setWatched(watchedRef.current);
              }, 1000);
            } else {
              if (tickRef.current) {
                window.clearInterval(tickRef.current);
                tickRef.current = null;
              }
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      if (tickRef.current) window.clearInterval(tickRef.current);
      try {
        playerRef.current?.destroy?.();
      } catch {}
    };
  }, [videoId]);

  useEffect(() => {
    if (completed) return;
    if (minWatchSeconds > 0 && watched >= minWatchSeconds) {
      setCompleted(true);
      onComplete?.();
    } else if (minWatchSeconds === 0 && duration > 0 && watched >= duration * 0.9) {
      setCompleted(true);
      onComplete?.();
    }
  }, [watched, duration, minWatchSeconds, completed, onComplete]);

  const target = minWatchSeconds > 0 ? minWatchSeconds : Math.max(duration * 0.9, 1);
  const pct = Math.min(100, (watched / target) * 100);

  return (
    <div className="space-y-3">
      <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-elegant ring-1 ring-border">
        <div ref={containerRef} className="absolute inset-0" />
        {/* Block click-through to YouTube controls / title overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-black/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 to-transparent" />
        {error && (
          <div className="absolute inset-0 grid place-items-center text-white text-sm bg-black/80">
            <div className="flex items-center gap-2"><Youtube className="h-5 w-5 text-red-500" /> {error}</div>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Watched {Math.floor(watched)}s {duration ? `/ ${Math.floor(target)}s` : ""}</span>
          {completed && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Complete</span>}
        </div>
        <Progress value={pct} />
      </div>
    </div>
  );
}
