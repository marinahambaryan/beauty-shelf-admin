"use server";

import { FunctionsHttpError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { rpc, RpcError } from "@/lib/rpc";
import { createClient } from "@/lib/supabase/server";
import { attempt, field } from "./run";
import type { ActionState } from "./state";

const FUNCTION_ERRORS: Record<string, string> = {
  target_is_admin: "Remove their admin access first.",
  not_found: "This account no longer exists.",
  not_admin: "This account doesn't have admin access.",
};

async function accountAction(action: "suspend" | "restore" | "delete", userId: string) {
  const supabase = await createClient();
  const { error } = await supabase.functions.invoke("admin-users", { body: { action, userId } });
  if (!error) return;

  if (error instanceof FunctionsHttpError) {
    const { status } = error.context as Response;
    const body = await (error.context as Response).json().catch(() => null);
    if (status === 404 && !body?.error) throw new RpcError("The admin-users function isn't deployed yet.");
    throw new RpcError(FUNCTION_ERRORS[body?.error] ?? "That didn't work. Try again.");
  }
  throw new RpcError("Can't reach the admin-users function. Try again.");
}

export async function setSuspended(userId: string, suspended: boolean): Promise<ActionState> {
  const result = await attempt(suspended ? "Account suspended" : "Account restored", () =>
    accountAction(suspended ? "suspend" : "restore", userId),
  );
  revalidatePath("/users", "layout");
  return result;
}

export async function setAdmin(userId: string, isAdmin: boolean): Promise<ActionState> {
  const result = await attempt(isAdmin ? "Admin access given" : "Admin access removed", () =>
    rpc("admin_set_admin", { p_user_id: userId, p_is_admin: isAdmin }),
  );
  revalidatePath("/users", "layout");
  return result;
}

export async function deleteUser(userId: string, email: string, _: ActionState, form: FormData) {
  if (field(form, "confirm").toLowerCase() !== email.toLowerCase()) {
    return { error: "Type the account's email to confirm." };
  }
  const result = await attempt("Account deleted", () => accountAction("delete", userId));
  if (result.error) return result;
  revalidatePath("/users", "layout");
  redirect("/users?done=deleted");
}
