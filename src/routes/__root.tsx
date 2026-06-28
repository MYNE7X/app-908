import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";
import { OfflineGate } from "@/components/offline-gate";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn&apos;t load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try again or sign in again.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/auth"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Sign in
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <OfflineGate>
        <Outlet />
      </OfflineGate>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          classNames: {
            toast:
              "rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-white/20 backdrop-blur-md font-medium text-sm px-4 py-3 gap-3 min-w-[280px] max-w-[420px]",
            title: "font-bold text-[13px] tracking-tight",
            description: "text-[11px] opacity-75 leading-relaxed",
            success:
              "!bg-gradient-to-r !from-emerald-500 !to-teal-500 !text-white !border-emerald-400/40",
            error:
              "!bg-gradient-to-r !from-rose-500 !to-pink-600 !text-white !border-rose-400/40",
            warning:
              "!bg-gradient-to-r !from-amber-400 !to-orange-500 !text-white !border-amber-400/40",
            info:
              "!bg-gradient-to-r !from-violet-500 !to-indigo-600 !text-white !border-violet-400/40",
            icon: "!text-white",
          },
          duration: 3500,
        }}
        expand={false}
        offset={20}
        gap={8}
      />
    </QueryClientProvider>
  );
}
