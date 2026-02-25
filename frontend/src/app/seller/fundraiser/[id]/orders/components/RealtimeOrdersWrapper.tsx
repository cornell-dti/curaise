"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { OrdersTableWrapper } from "./OrdersTableWrapper";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";
import { toast } from "sonner";

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
  const previousOrderCountRef = useRef<number>(initialOrders.length);

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
            const newOrders = validatedData.data;
            const newOrderCount = newOrders.length;
            const previousCount = previousOrderCountRef.current;

            // Show notification if new orders were added
            if (newOrderCount > previousCount) {
              const numNewOrders = newOrderCount - previousCount;
              toast.success(
                `${numNewOrders} new order${numNewOrders > 1 ? "s" : ""} received!`,
                {
                  position: "bottom-right",
                  duration: 4000,
                }
              );
            }

            previousOrderCountRef.current = newOrderCount;
            setOrders(newOrders);
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
