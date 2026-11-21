import "server-only";
import { RpcError } from "@/lib/rpc";
import type { ActionState } from "./state";

/** Runs a change and turns a refusal into a message for the form. */
export async function attempt(saved: string, change: () => Promise<unknown>): Promise<ActionState> {
  try {
    await change();
    return { saved };
  } catch (e) {
    if (e instanceof RpcError) return { error: e.message };
    console.error(e);
    return { error: "Can't reach the database right now. Try again." };
  }
}

export const field = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v.trim() : "";
};
