import "server-only";
import { createClient } from "@/lib/supabase/server";

/** A database refusal. `message` is a person-readable sentence when the database gave one. */
export class RpcError extends Error {
  constructor(
    message: string,
    public code?: string,
    public reason?: string,
  ) {
    super(message);
  }
}

const NOT_SET_UP = "PGRST202"; // PostgREST: no such function.

export async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(fn, args);
  if (error) {
    if (error.code === NOT_SET_UP) {
      throw new RpcError("The admin migration hasn't been applied to this database.", error.code);
    }
    throw new RpcError(error.hint || "That didn't work. Try again.", error.code, error.message);
  }
  return data as T;
}

