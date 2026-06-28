import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });

      if (!location.pathname.startsWith("/profile")) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, city")
          .eq("id", data.user.id)
          .maybeSingle();

        const isNewUser = !profile?.full_name && !profile?.phone && !profile?.city;
        if (isNewUser) {
          throw redirect({ to: "/profile" });
        }
      }

      return { user: data.user };
    } catch (e) {
      if (isRedirect(e)) throw e;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
