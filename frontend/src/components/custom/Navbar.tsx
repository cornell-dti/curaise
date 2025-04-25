"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, User, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { signInWithGoogle, signOut, getUser } from "@/lib/auth-actions";

type UserRole = "buyer" | "seller";

export default function Navbar() {
  const [role, setRole] = useState<UserRole>("buyer");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const user = await getUser();
        setIsLoggedIn(!!user);
      } catch (error) {
        console.error("Error checking login status:", error);
      }
    };
    checkLoginStatus();
  }, []);

  const toggleRole = () => {
    setRole(role === "buyer" ? "seller" : "buyer");
  };

  const handleLogout = () => {
    signOut();
    setIsLoggedIn(false);
  };

  const handleLogin = () => {
    signInWithGoogle();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-8 lg:px-12">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold">
            CURaise
          </Link>
        </div>

        {/* Desktop Navigation - With even spacing */}
        <div className="hidden md:flex md:flex-1 justify-end">
          {role === "buyer" ? (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/buyer" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} text-lg font-medium`}
                    >
                      Browse
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/buyer" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} text-lg font-medium`}
                    >
                      Orders
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          ) : (
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link href="/seller" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${navigationMenuTriggerStyle()} text-lg font-medium`}
                    >
                      Organizations
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          )}
        </div>

        {/* User Menu (Desktop) */}
        <div className="hidden md:flex md:items-center">
          {isLoggedIn ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full ml-2"
                  >
                    <User className="h-5 w-5" />
                    <span className="sr-only">User menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-35">
                  <DropdownMenuItem onClick={toggleRole} className="text-base">
                    Switch to {role === "buyer" ? "Seller" : "Buyer"}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-base"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={handleLogin} className="text-base ml-2">
              Login
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="mb-4">
                <SheetTitle className="text-2xl">CuRaise</SheetTitle>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                {role === "buyer" ? (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/buyer"
                        className="flex items-center py-2 text-xl font-semibold"
                      >
                        Browse
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/buyer"
                        className="flex items-center py-2 text-xl font-semibold"
                      >
                        Orders
                      </Link>
                    </SheetClose>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <Link
                        href="/seller"
                        className="flex items-center py-2 text-xl font-semibold"
                      >
                        Organizations
                      </Link>
                    </SheetClose>
                  </>
                )}
                <div className="border-t pt-4">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-lg"
                    onClick={toggleRole}
                  >
                    Switch to {role === "buyer" ? "Seller" : "Buyer"}
                  </Button>
                  {isLoggedIn ? (
                    <Button
                      variant="outline"
                      className="mt-2 w-full justify-start text-lg"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  ) : (
                    <Button
                      className="mt-2 w-full text-lg"
                      onClick={handleLogin}
                    >
                      Login
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
