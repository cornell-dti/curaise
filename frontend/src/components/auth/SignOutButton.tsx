"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import posthog from "posthog-js";

const SignOutButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        posthog.reset();
        signOut();
      }}
    >
      Sign Out
    </Button>
  );
};

export { SignOutButton };
