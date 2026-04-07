"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { ReferralsTableWrapper } from "./ReferralsTableWrapper";
import { CompleteFundraiserSchema } from "common/schemas/fundraiser";
import { z } from "zod";
import { CompleteOrderSchema } from "common/schemas/order";

type Referral = z.infer<typeof CompleteFundraiserSchema>["referrals"][number];
type Order = z.infer<typeof CompleteOrderSchema>;

interface RealtimeReferralsWrapperProps {
  initialReferrals: Referral[];
  fundraiserId: string;
  orders: Order[];
  token: string;
}

export function RealtimeReferralsWrapper({
  initialReferrals,
  fundraiserId,
  orders,
  token,
}: RealtimeReferralsWrapperProps) {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const refetchReferrals = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          const validatedData = CompleteFundraiserSchema.safeParse(result.data);
          if (validatedData.success) {
            setReferrals(validatedData.data.referrals);
          } else {
            console.error("Invalid fundraiser data format:", validatedData.error);
          }
        } else {
          console.error("Failed to refetch referrals:", result.message);
        }
      } catch (error) {
        console.error("Error refetching referrals:", error);
        // Keep existing data on error (graceful degradation)
      }
    };

    let isCancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data } = await supabase.auth.getSession();
      const realtimeToken = data.session?.access_token ?? token;
      if (!realtimeToken) {
        return;
      }

      supabase.realtime.setAuth(realtimeToken);
      if (isCancelled) return;

      channel = supabase
        .channel(`referrals-${fundraiserId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "referrals",
          },
          () => {
            refetchReferrals();
          }
        )
        .subscribe();
    };

    void setupRealtime();

    return () => {
      isCancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [fundraiserId, token, supabase]);

  return <ReferralsTableWrapper referrals={referrals} orders={orders} />;
}
