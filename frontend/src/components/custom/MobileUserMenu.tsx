"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import { LogOut, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";

type UserRole = "buyer" | "seller";

export default function MobileUserMenu({ userRole }: { userRole: UserRole }) {
  const [loggedIn, setLoggedIn] = useState(true);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        setLoggedIn(false);
      } else {
        setLoggedIn(true);
      }
    };
    checkLoginStatus();
  }, []);

  const toggleRole = () => {
    if (userRole === "buyer") {
      redirect("/seller");
    } else if (userRole === "seller") {
      redirect("/buyer");
    }
  };

  const handleLogout = () => {
    signOut();
  };

  return (
    <>
      {loggedIn ? (
        <div className="border-t pt-4">
          <Button
            variant="outline"
            className="w-full justify-start text-lg"
            onClick={toggleRole}
          >
            Switch to {userRole === "buyer" ? "Seller" : "Buyer"}
          </Button>

          <Button
            variant="outline"
            className="mt-2 w-full justify-start text-lg"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start text-lg"
          onClick={signInWithGoogle}
        >
          <User className="mr-2 h-4 w-4" />
          Log in
        </Button>
      )}
    </>
  );
}
