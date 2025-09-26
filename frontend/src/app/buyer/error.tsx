"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center min-h-screen px-4 py-12 sm:px-6 md:px-8 lg:px-12 xl:px-16">
      <div className="w-full space-y-6 text-center">
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-2xl">
            {error.message}
          </h1>
          <h2 className="text-2xl tracking-tighter sm:text-xl">
            {error.digest}
          </h2>
          <div className="flex items-center justify-center space-x-2">
            <Button onClick={reset}>Try again</Button>
            <Button variant="outline" asChild>
              <Link href="/buyer">Go to buyer home page</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
