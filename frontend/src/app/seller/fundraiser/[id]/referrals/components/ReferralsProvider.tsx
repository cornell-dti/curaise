"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createClient } from "@/utils/supabase/client";
import { CompleteFundraiserSchema, ReferralSchema } from "common";
import { z } from "zod";

type Referral = z.infer<typeof ReferralSchema>;

interface ReferralsContextValue {
  referrals: Referral[];
  fundraiserId: string;
  refetch: () => Promise<void>;
}

const ReferralsContext = createContext<ReferralsContextValue | null>(null);

// Single source of truth for a fundraiser's referrals on the seller page.
// The header badge, the approval modal and the referrals table all read from
// here, so approving or removing someone updates every one of them at once.
export function ReferralsProvider({
  initialReferrals,
  fundraiserId,
  token,
  children,
}: {
  initialReferrals: Referral[];
  fundraiserId: string;
  token: string;
  children: React.ReactNode;
}) {
  const [referrals, setReferrals] = useState<Referral[]>(initialReferrals);
  const supabase = useMemo(() => createClient(), []);

  const refetch = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token ?? token;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const result = await response.json();

      if (!response.ok) {
        console.error("Failed to refetch referrals:", result.message);
        return;
      }

      const parsed = CompleteFundraiserSchema.safeParse(result.data);
      if (parsed.success) {
        setReferrals(parsed.data.referrals);
      } else {
        console.error("Invalid fundraiser data format:", parsed.error);
      }
    } catch (error) {
      // Keep the existing list on error
      console.error("Error refetching referrals:", error);
    }
  }, [fundraiserId, token, supabase]);

  useEffect(() => {
    let isCancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data } = await supabase.auth.getSession();
      const realtimeToken = data.session?.access_token ?? token;
      if (!realtimeToken) return;

      supabase.realtime.setAuth(realtimeToken);
      if (isCancelled) return;

      channel = supabase
        .channel(`referrals-${fundraiserId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "referrals" },
          () => {
            void refetch();
          },
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
  }, [fundraiserId, token, supabase, refetch]);

  const value = useMemo(
    () => ({ referrals, fundraiserId, refetch }),
    [referrals, fundraiserId, refetch],
  );

  return (
    <ReferralsContext.Provider value={value}>
      {children}
    </ReferralsContext.Provider>
  );
}

export function useReferrals() {
  const context = useContext(ReferralsContext);
  if (!context) {
    throw new Error("useReferrals must be used within a ReferralsProvider");
  }
  return context;
}
