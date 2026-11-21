import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Gate for every page. It keeps people out of the interface; the real check is in the
 * database, where each admin_* function tests is_admin() for itself.
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error?.code === "PGRST202") redirect("/sign-in?problem=setup");
  if (error) throw new Error("Can't check admin access.");
  if (!isAdmin) redirect("/sign-in?problem=access");
  return user;
});
