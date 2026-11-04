"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { resetPostHog } from "@/lib/posthog";

const SignOutButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        resetPostHog();
        signOut();
      }}
    >
      Sign Out
    </Button>
  );
};

export { SignOutButton };
