"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/utils/supabase/client";
import { OrdersTableWrapper } from "./OrdersTableWrapper";
import { CompleteOrderSchema } from "common/schemas/order";
import { z } from "zod";
import { toast } from "sonner";
import { mutate } from "swr";

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
  // Stable reference — createClient() must not be called on every render
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    // Only used for INSERT events where we need full relations
    const fetchSingleOrder = async (orderId: string): Promise<Order | null> => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/order/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const result = await response.json();
        if (response.ok) {
          const validated = CompleteOrderSchema.safeParse(result.data);
          if (validated.success) return validated.data;
        }
      } catch (error) {
        console.error("Error fetching new order:", error);
      }
      return null;
    };

    const channel = supabase
      .channel(`orders-${fundraiserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `fundraiser_id=eq.${fundraiserId}`,
        },
        async (payload) => {
          const newOrder = await fetchSingleOrder(payload.new.id as string);
          if (!newOrder) return;
          setOrders((prev) => {
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            toast.success("New order received!", {
              position: "bottom-right",
              duration: 4000,
            });
            return [newOrder, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          const row = payload.new;
          setOrders((prev) =>
            prev.map((order) => {
              if (order.id !== row.id) return order;
              const updated: Order = {
                ...order,
                pickedUp: row.picked_up ?? order.pickedUp,
                paymentStatus: row.payment_status ?? order.paymentStatus,
                paymentMethod: row.payment_method ?? order.paymentMethod,
              };
              // Sync SWR cache so PickupStatusCell / PaymentStatusCell update too
              mutate(`/order/${order.id}`, updated, false);
              return updated;
            })
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      )
      .subscribe();

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
