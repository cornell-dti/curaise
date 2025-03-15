"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
        hd: "cornell.edu", // restrict domain to just @cornell.edu google accounts
      },
      redirectTo: `${origin}/auth/callback`, // go to the route handler to handle the callback
    },
  });

  if (error) {
    console.log(error);
    redirect("/login"); // TODO: add error page
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.log(error);
    redirect("/logout"); // TODO: add error page
  }

  redirect("/");
}
