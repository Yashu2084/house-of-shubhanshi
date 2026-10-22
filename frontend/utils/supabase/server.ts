import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const createClient = (cookieStore?: any) => {
  const resolvedStore = cookieStore || (typeof cookies === 'function' ? cookies() : null);

  return createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() {
          if (resolvedStore && typeof resolvedStore.getAll === 'function') {
            return resolvedStore.getAll();
          }
          return [];
        },
        setAll(cookiesToSet) {
          try {
            if (resolvedStore && typeof resolvedStore.set === 'function') {
              cookiesToSet.forEach(({ name, value, options }) =>
                resolvedStore.set(name, value, options)
              );
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    },
  );
};
