import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  LayoutDashboard, ListTodo, Video, Wallet, TrendingUp,
  User, Bell, Star, Shield, Crown, LogOut, Menu, Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUserContext } from "@/lib/auth.functions";
import { toast } from "sonner";
import { PushNotifications } from "@/components/push-notifications";
import { BrandLogo } from "@/components/brand-logo";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", icon: ListTodo },
  { to: "/video-tasks", label: "Video Tasks", icon: Video },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/earnings", label: "Earnings", icon: TrendingUp },
  { to: "/reviews", label: "Reviews", icon: Star },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const navigate = useNavigate();
  const fetchCtx = useServerFn(getCurrentUserContext);
  const { data: ctx } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchCtx(),
    enabled: authReady,
    retry: false,
  });

  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.access_token) setAuthReady(true);
      else navigate({ to: "/auth", replace: true });
    });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between gap-2 px-4 h-14 border-b bg-background/80 backdrop-blur">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent ctx={ctx} onSignOut={signOut} />
          </SheetContent>
        </Sheet>
        <Link to="/dashboard" aria-label="Home">
          <BrandLogo size="sm" />
        </Link>
        <Link to="/profile" aria-label="Profile">
          <Avatar className="h-8 w-8">
            <AvatarImage src={ctx?.profile?.avatar_url ?? undefined} />
            <AvatarFallback>{(ctx?.profile?.full_name ?? "U")[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
      </header>

      <div className="lg:flex">
        <aside className="hidden lg:flex sticky top-0 h-screen w-64 shrink-0 border-r bg-sidebar text-sidebar-foreground">
          <SidebarContent ctx={ctx} onSignOut={signOut} />
        </aside>

        <main className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8 max-w-7xl mx-auto">
            <div className="mb-4 flex justify-end"><PushNotifications userId={ctx?.userId} /></div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({
  ctx,
  onSignOut,
}: {
  ctx: Awaited<ReturnType<typeof getCurrentUserContext>> | undefined;
  onSignOut: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex flex-col w-full h-full">
      <div className="px-5 py-5 border-b">
        <BrandLogo size="md" showTagline />
      </div>


      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors min-h-11",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {ctx?.isAdmin && (
          <Link to="/admin" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent/60 min-h-11">
            <Shield className="h-4 w-4" /> Admin
          </Link>
        )}
        {ctx?.isSuperAdmin && (
          <Link to="/super-admin" className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium hover:bg-sidebar-accent/60 min-h-11">
            <Crown className="h-4 w-4" /> Super Admin
          </Link>
        )}
      </nav>

      <div className="border-t p-3 space-y-2">
        <div className="flex items-center gap-2 px-2">
          <Avatar className="h-9 w-9">
            <AvatarImage src={ctx?.profile?.avatar_url ?? undefined} />
            <AvatarFallback>{(ctx?.profile?.full_name ?? "U")[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">{ctx?.profile?.full_name ?? "Member"}</div>
            <div className="text-xs text-muted-foreground truncate">
              ${Number(ctx?.wallet?.available_balance ?? 0).toFixed(2)} available
            </div>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start" onClick={onSignOut}>
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>
    </div>
  );
}
