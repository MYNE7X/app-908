import { useEffect, useState, type ReactNode } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoAsset from "@/assets/expert-solutions-logo.png.asset.json";

export function OfflineGate({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(typeof navigator === "undefined" ? true : navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-gradient-to-br from-background via-background to-muted px-6">
      <div className="max-w-md w-full text-center">
        <div className="relative mx-auto w-fit">
          <span className="absolute -inset-6 rounded-full bg-gradient-to-tr from-cyan-400/20 via-primary/30 to-fuchsia-500/20 blur-2xl" />
          <img
            src={logoAsset.url}
            alt="Expert Solutions"
            className="relative h-20 w-auto object-contain mx-auto opacity-90"
          />
        </div>
        <div className="mt-8 mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
          <WifiOff className="h-8 w-8" />
        </div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-tight">You're offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Check your internet connection and try again. Expert Solutions needs a live connection to load tasks, videos and your wallet.
        </p>
        <Button className="mt-6" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" /> Retry connection
        </Button>
      </div>
    </div>
  );
}
