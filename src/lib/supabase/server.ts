import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** A Supabase client acting as the signed-in person. The database decides what they can do. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(toSet) {
          // Server Components can't set cookies; the proxy keeps the session fresh for those.
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {}
        },
      },
    },
  );
}
