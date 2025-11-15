"use client";

import type React from "react";
import { Truck } from "lucide-react";
import { CompleteFundraiserSchema } from "common";
import { z } from "zod";

export function UnpublishedFundraiser({
  fundraiser,
}: {
  fundraiser: z.infer<typeof CompleteFundraiserSchema>;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 space-y-6 text-center">
      <div className="relative max-w-md w-full space-y-3">
        <Truck className="w-20 h-20 animate-move-across" />
        <h1 className="text-4xl md:text-5xl font-bold text-foreground text-balance">
          Coming Soon
        </h1>
        <p className="text-lg text-muted-foreground">
          {fundraiser.organization.name} is currently still working on this
          fundraiser. Check back soon!
        </p>
      </div>
    </div>
  );
}
