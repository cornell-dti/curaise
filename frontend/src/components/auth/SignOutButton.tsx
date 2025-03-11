"use client";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";

const SignOutButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => {
        signOut();
      }}
    >
      Sign Out
    </Button>
  );
};

export { SignOutButton };
