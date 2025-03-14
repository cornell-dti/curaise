"use client";

import { Button } from "@/components/ui/button";
import { signInWithGoogle } from "@/lib/auth-actions";

const SignInWithGoogleButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        signInWithGoogle();
      }}
    >
      Login with Google
    </Button>
  );
};

export { SignInWithGoogleButton };
