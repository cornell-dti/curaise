import { signInWithGoogle } from "@/lib/auth-actions";
import { AutoGoogleLoginAutoSubmit } from "./AutoGoogleLoginClient";

async function autoGoogleLoginAction(formData: FormData) {
  "use server";
  const nextPath = (formData.get("next") as string | null) ?? undefined;
  await signInWithGoogle(nextPath);
}

export function AutoGoogleLogin({ next }: { next?: string }) {
  return (
    <form
      id="auto-google-login-form"
      action={autoGoogleLoginAction}
    >
      <input type="hidden" name="next" value={next ?? "/buyer"} />
      <p className="text-center text-sm text-muted-foreground">
        Redirecting you to Google to sign in...
      </p>
      <AutoGoogleLoginAutoSubmit />
    </form>
  );
}
