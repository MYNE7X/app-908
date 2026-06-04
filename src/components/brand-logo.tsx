import { cn } from "@/lib/utils";
import logoAsset from "@/assets/expert-solutions-logo.png.asset.json";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  variant?: "default" | "onPrimary";
  showWordmark?: boolean;
}

const sizeMap = {
  sm: { img: "h-9", text: "text-base", tag: "text-[10px]" },
  md: { img: "h-11", text: "text-lg", tag: "text-[11px]" },
  lg: { img: "h-14", text: "text-2xl", tag: "text-xs" },
  xl: { img: "h-20", text: "text-3xl", tag: "text-sm" },
};

export function BrandLogo({
  className,
  size = "md",
  showTagline = false,
  variant = "default",
  showWordmark = false,
}: Props) {
  const s = sizeMap[size];
  const onPrimary = variant === "onPrimary";
  return (
    <div className={cn("flex items-center gap-2.5 group", className)}>
      <div className="relative shrink-0">
        <span
          aria-hidden
          className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-cyan-400/40 via-primary/40 to-fuchsia-500/30 blur-xl opacity-70 group-hover:opacity-100 transition"
        />
        <img
          src={logoAsset.url}
          alt="Expert Solutions"
          className={cn(
            "relative w-auto object-contain drop-shadow-[0_0_18px_rgba(56,189,248,0.45)] select-none",
            s.img,
          )}
          draggable={false}
        />
      </div>
      {showWordmark && (
        <div className="leading-tight">
          <div
            className={cn(
              "font-extrabold tracking-tight",
              s.text,
              onPrimary
                ? "text-primary-foreground"
                : "bg-gradient-to-r from-cyan-400 via-primary to-fuchsia-500 bg-clip-text text-transparent",
            )}
          >
            Expert<span className="ml-1 opacity-80">Solutions</span>
          </div>
          {showTagline && (
            <div
              className={cn(
                "uppercase tracking-[0.22em] font-medium",
                s.tag,
                onPrimary ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              Trading · Online Work · Consultancy
            </div>
          )}
        </div>
      )}
    </div>
  );
}
