import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  variant?: "default" | "onPrimary";
}

const sizeMap = {
  sm: { box: "h-8 w-8", icon: "h-4 w-4", text: "text-base", tag: "text-[10px]" },
  md: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg", tag: "text-[11px]" },
  lg: { box: "h-12 w-12", icon: "h-6 w-6", text: "text-2xl", tag: "text-xs" },
};

export function BrandLogo({ className, size = "md", showTagline = false, variant = "default" }: Props) {
  const s = sizeMap[size];
  const onPrimary = variant === "onPrimary";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "relative grid place-items-center rounded-xl shadow-glow",
          "bg-gradient-to-br from-primary via-primary-glow to-primary",
          "ring-1 ring-white/20",
          s.box,
        )}
      >
        {/* stylised "E" monogram */}
        <svg viewBox="0 0 24 24" className={cn("text-white drop-shadow", s.icon)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 4H8a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h10" />
          <path d="M8 12h7" />
          <circle cx="19.5" cy="6.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
        <span className="absolute -inset-1 rounded-2xl bg-primary/20 blur-md -z-10" aria-hidden />
      </div>
      <div className="leading-tight">
        <div
          className={cn(
            "font-extrabold tracking-tight",
            s.text,
            onPrimary
              ? "text-primary-foreground"
              : "bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent",
          )}
        >
          Expert<span className={cn("ml-0.5", onPrimary ? "opacity-80" : "text-foreground/80 bg-none")}>Solutions</span>
        </div>
        {showTagline && (
          <div className={cn("uppercase tracking-[0.18em] font-medium", s.tag, onPrimary ? "text-primary-foreground/70" : "text-muted-foreground")}>
            Earn · Verify · Withdraw
          </div>
        )}
      </div>
    </div>
  );
}
