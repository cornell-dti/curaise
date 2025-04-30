"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { signInWithGoogle, signOut } from "@/lib/auth-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { redirect } from "next/navigation";
import { Button } from "../ui/button";

type UserRole = "buyer" | "seller";

export default function DesktopUserMenu({ userRole }: { userRole: UserRole }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full ml-2">
          <User className="h-5 w-5" />
          <span className="sr-only">User menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-35">
        {loggedIn ? (
          <>
            <DropdownMenuItem onClick={toggleRole} className="text-base">
              Switch to {userRole === "buyer" ? "Seller" : "Buyer"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-base">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={signInWithGoogle} className="text-base">
            <User className="mr-2 h-4 w-4" />
            <span>Log In</span>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
