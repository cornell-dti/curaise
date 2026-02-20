import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createClient } from "@/utils/supabase/server";

// Route Handler to handle the callback from the OAuth provider
// This route is called after the user logs in with the OAuth provider and handles the code exchange to save the user session to cookies.
// source: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=web&queryGroups=environment&environment=server&queryGroups=framework&framework=nextjs#application-code
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  const supabase = await createClient();
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      let decodedNext = next;
      try {
        decodedNext = decodeURIComponent(next);
      } catch {
        // already decoded or malformed; keep as-is
      }

      const base = isLocalEnv
        ? origin
        : forwardedHost
          ? `https://${forwardedHost}`
          : origin;

      return NextResponse.redirect(new URL(decodedNext, base));
    } else {
      console.log("[auth/callback] exchangeCodeForSession error:", error);
    }
  }

  // If user is already logged in, redirect to 'next' instead of error page
  if (existingUser) {
    let decodedNext = next;
    try {
      decodedNext = decodeURIComponent(next);
    } catch {
      // already decoded or malformed; keep as-is
    }
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";
    const base = isLocalEnv
      ? origin
      : forwardedHost
        ? `https://${forwardedHost}`
        : origin;
    return NextResponse.redirect(new URL(decodedNext, base));
  }
  // Otherwise, return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
