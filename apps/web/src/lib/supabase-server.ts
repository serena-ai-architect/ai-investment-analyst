import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const isConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — can't set cookies
          }
        },
      },
    }
  );
}

/**
 * Safe Supabase query wrapper. Returns null if Supabase is not configured.
 */
export async function safeQuery<T>(
  queryFn: (supabase: Awaited<ReturnType<typeof createClient>>) => PromiseLike<{ data: T | null }>
): Promise<T | null> {
  if (!isConfigured) return null;
  try {
    const supabase = await createClient();
    const { data } = await queryFn(supabase);
    return data;
  } catch {
    return null;
  }
}

export { isConfigured as isSupabaseConfigured };
