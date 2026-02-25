"use client";

import { useEffect, useState } from "react";
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
  const supabase = createClient();

  useEffect(() => {
    // Refetch referrals from fundraiser endpoint (referrals are nested)
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

    // Set up realtime subscription
    const channel = supabase
      .channel(`referrals-${fundraiserId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "referrals",
          filter: `fundraiser_id=eq.${fundraiserId}`,
        },
        () => {
          // On any change event, refetch the full dataset
          refetchReferrals();
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("Subscribed to referrals realtime updates");
        } else if (status === "CHANNEL_ERROR") {
          console.error("Error subscribing to referrals channel");
        }
      });

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundraiserId, token, supabase]);

  return <ReferralsTableWrapper referrals={referrals} orders={orders} />;
}
