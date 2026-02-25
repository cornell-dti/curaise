"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { OrdersTableWrapper } from "./OrdersTableWrapper";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";

type Order = z.infer<typeof CompleteOrderSchema>;

interface RealtimeOrdersWrapperProps {
  initialOrders: Order[];
  fundraiserId: string;
  token: string;
  fundraiserName: string;
}

export function RealtimeOrdersWrapper({
  initialOrders,
  fundraiserId,
  token,
  fundraiserName,
}: RealtimeOrdersWrapperProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const supabase = createClient();

  useEffect(() => {
    // Refetch orders from API with all relations
    const refetchOrders = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/fundraiser/${fundraiserId}/orders`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const result = await response.json();

        if (response.ok) {
          const validatedData = CompleteOrderSchema.array().safeParse(result.data);
          if (validatedData.success) {
            setOrders(validatedData.data);
          } else {
            console.error("Invalid order data format:", validatedData.error);
          }
        } else {
          console.error("Failed to refetch orders:", result.message);
        }
      } catch (error) {
        console.error("Error refetching orders:", error);
        // Keep existing data on error (graceful degradation)
      }
    };

    // Set up realtime subscription
    const channel = supabase
      .channel(`orders-${fundraiserId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to INSERT, UPDATE, DELETE
          schema: "public",
          table: "orders",
        },
        () => {
          // On any change event, refetch the full dataset
          refetchOrders();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fundraiserId, token, supabase]);

  return (
    <OrdersTableWrapper
      orders={orders}
      token={token}
      fundraiserName={fundraiserName}
    />
  );
}
