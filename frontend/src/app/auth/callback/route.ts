import { NextResponse } from "next/server";
import { cookies } from "next/headers";
// The client you created from the Server-Side Auth instructions
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { createClient } from "@/utils/supabase/server";

const ALLOWED_EMAIL_DOMAIN = "@cornell.edu";

function isAllowedEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

async function redirectWithClearedSession(url: string): Promise<NextResponse> {
  const response = NextResponse.redirect(url);
  const cookieStore = await cookies();
  for (const c of cookieStore.getAll()) {
    if (c.name.startsWith("sb-")) response.cookies.delete(c.name);
  }
  return response;
}

function resolveBase(request: Request, origin: string): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  if (isLocalEnv) return origin;
  return forwardedHost ? `https://${forwardedHost}` : origin;
}

// Route Handler to handle the callback from the OAuth provider
// This route is called after the user logs in with the OAuth provider and handles the code exchange to save the user session to cookies.
// source: https://supabase.com/docs/guides/auth/social-login/auth-google?queryGroups=platform&platform=web&queryGroups=environment&environment=server&queryGroups=framework&framework=nextjs#application-code
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  const {
    data: { user: existingUser },
  } = await supabase.auth.getUser();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user: sessionUser },
      } = await supabase.auth.getUser();

      if (!isAllowedEmail(sessionUser?.email)) {
        await supabase.auth.signOut();
        return redirectWithClearedSession(
          `${origin}/auth/auth-code-error?reason=non_cornell`
        );
      }

      return NextResponse.redirect(new URL(next, resolveBase(request, origin)));
    } else {
      console.log("[auth/callback] exchangeCodeForSession error:", error);
    }
  }

  // If user is already logged in, redirect to 'next' instead of error page
  if (existingUser) {
    if (!isAllowedEmail(existingUser.email)) {
      await supabase.auth.signOut();
      return redirectWithClearedSession(
        `${origin}/auth/auth-code-error?reason=non_cornell`
      );
    }
    return NextResponse.redirect(new URL(next, resolveBase(request, origin)));
  }
  // Otherwise, return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
