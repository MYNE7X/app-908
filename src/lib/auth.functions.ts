import { supabase } from "@/integrations/supabase/client";

export type AppRole = "user" | "admin" | "super_admin";

export async function getCurrentUserContext() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const [profileRes, rolesRes, walletRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id),
    supabase.from("wallets").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
  return {
    userId: user.id,
    profile: profileRes.data,
    roles,
    isAdmin: roles.includes("admin") || roles.includes("super_admin"),
    isSuperAdmin: roles.includes("super_admin"),
    wallet: walletRes.data,
  };
}
