import type { BasicOrderSchema } from "common";
import type { z } from "zod";
import { ALLOWED_EMAIL_DOMAIN } from "./auth-domain";

type Order = z.infer<typeof BasicOrderSchema>;

// Manual orders are placed under the admin's account but record the real
// buyer's name and NetID, so prefer those over the linked user when present.
export function getOrderBuyer(order: Order) {
  if (order.buyerName && order.buyerNetId) {
    return {
      name: order.buyerName,
      netId: order.buyerNetId,
      email: `${order.buyerNetId}${ALLOWED_EMAIL_DOMAIN}`,
    };
  }

  return {
    name: order.buyer.name,
    netId: order.buyer.email.split("@")[0],
    email: order.buyer.email,
  };
}
