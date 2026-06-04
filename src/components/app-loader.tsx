import logoAsset from "@/assets/expert-solutions-logo.png.asset.json";

export function AppLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <span className="absolute -inset-6 rounded-full bg-gradient-to-tr from-cyan-400/30 via-primary/40 to-fuchsia-500/30 blur-2xl animate-pulse" />
          <img
            src={logoAsset.url}
            alt="Expert Solutions"
            className="relative h-24 w-auto object-contain drop-shadow-[0_0_28px_rgba(56,189,248,0.55)] animate-[pulse_2s_ease-in-out_infinite]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-fuchsia-500 animate-bounce" />
        </div>
        <p className="text-sm text-muted-foreground tracking-wide">{label}</p>
      </div>
    </div>
  );
}
