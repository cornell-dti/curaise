"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { LogOut } from "lucide-react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background h-16 md:h-20">
        <div className="flex items-center justify-between px-4 md:px-[157px] h-full">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Image
                src="/images/curaise-logo.svg"
                alt="CURaise"
                width={347}
                height={117}
                className="h-10 md:h-12 w-auto"
              />
            </Link>
            <span className="text-sm font-medium text-muted-foreground border-l pl-3">
              Admin
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-grow pt-6 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
