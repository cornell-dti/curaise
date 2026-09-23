import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { isAllowedEmail } from "@/lib/auth-domain";

// middleware responsible for refreshing the supabase auth token and saving to cookies
// source: https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=app
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectWithCookies = (url: URL) => {
    const response = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) =>
      response.cookies.set(cookie)
    );
    return response;
  };

  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // Return to the requested page after login.
    const url = request.nextUrl.clone();
    const nextPath = `${url.pathname}${url.search}`;
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", nextPath);
    return redirectWithCookies(url);
  }

  // A session can outlive the domain check in /auth/callback (that route only
  // runs at sign-in). Drop it here too, so an existing non-Cornell session is
  // signed out instead of being let through the frontend and 403ing on every
  // backend call.
  if (user && !isAllowedEmail(user.email)) {
    await supabase.auth.signOut();

    const url = request.nextUrl.clone();
    url.pathname = "/auth/auth-code-error";
    url.search = "";
    url.searchParams.set("reason", "non_cornell");

    const response = redirectWithCookies(url);
    request.cookies
      .getAll()
      .forEach(
        (cookie) =>
          cookie.name.startsWith("sb-") && response.cookies.delete(cookie.name)
      );
    return response;
  }

  if (user && request.nextUrl.pathname.startsWith("/login")) {
    // user is logged in, redirect to the next parameter or home page
    const next = sanitizeNextPath(request.nextUrl.searchParams.get("next"), "");
    if (next) {
      return redirectWithCookies(new URL(next, request.url));
    }

    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return redirectWithCookies(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    supabaseResponse.cookies.getAll().forEach((cookie) => myNewResponse.cookies.set(cookie))
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
