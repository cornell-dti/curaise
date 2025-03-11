import { createBrowserClient } from "@supabase/ssr";

// ONLY USE THIS FUNCTION IN CLIENT COMPONENTS
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
