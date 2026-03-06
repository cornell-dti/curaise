import { prisma } from "../../utils/prisma";
import { CreateOrderBody } from "common";
import { z } from "zod";
import {
  updateCacheForNewOrder,
  updateCacheForOrderPickup,
} from "../fundraiser/fundraiser.services";
import { Decimal } from "decimal.js";

export const getOrder = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          published: true,
          goalAmount: true,
          imageUrls: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
              admins: {
                select: { id: true },
              },
            },
          },
          pickupEvents: {
            orderBy: {
              startsAt: "asc",
            },
          },
        },
      },
      items: {
        select: {
          quantity: true,
          item: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              offsale: true,
            },
          },
        },
      },
      referral: {
        include: {
          referrer: true,
        },
      },
    },
  });

  return order;
};

export const createOrder = async (
  orderBody: z.infer<typeof CreateOrderBody> & { buyerId: string }
) => {
  const order = await prisma.$transaction(
    async (tx) => {
      // Validate stock availability inside transaction
      const itemIds = orderBody.items.map((oi) => oi.itemId);

      const items = await tx.item.findMany({
        where: { id: { in: itemIds } },
        select: { id: true, limit: true, name: true },
      });

      // Query confirmed counts inside the transaction so the Serializable
      // isolation level actually covers both the read and the write.
      // Count orders that are either CONFIRMED or have been picked up.
      const confirmedResults = await tx.orderItems.groupBy({
        by: ["itemId"],
        where: {
          itemId: { in: itemIds },
          order: {
            OR: [{ paymentStatus: "CONFIRMED" }, { pickedUp: true }],
          },
        },
        _sum: { quantity: true },
      });
      const confirmedCounts = new Map<string, number>();
      itemIds.forEach((id) => confirmedCounts.set(id, 0));
      confirmedResults.forEach((r) => {
        confirmedCounts.set(r.itemId, r._sum.quantity ?? 0);
      });

      for (const orderItem of orderBody.items) {
        const item = items.find((i) => i.id === orderItem.itemId);
        if (!item) {
          throw new Error(`Item ${orderItem.itemId} not found`);
        }

        if (item.limit !== null) {
          const confirmedCount = confirmedCounts.get(orderItem.itemId) ?? 0;
          const newTotal = confirmedCount + orderItem.quantity;

          if (newTotal > item.limit) {
            const available = item.limit - confirmedCount;
            throw new Error(
              `Insufficient stock for ${item.name}. Available: ${available}, Requested: ${orderItem.quantity}`
            );
          }
        }
      }

      return tx.order.create({
        data: {
          paymentMethod: orderBody.payment_method,
          paymentStatus:
            orderBody.payment_method === "VENMO" ? "PENDING" : "UNVERIFIABLE",
          buyer: { connect: { id: orderBody.buyerId } },
          fundraiser: { connect: { id: orderBody.fundraiserId } },
          items: {
            create: orderBody.items.map((item) => ({
              quantity: item.quantity,
              item: { connect: { id: item.itemId } },
            })),
          },
          ...(orderBody.referralId && {
            referral: { connect: { id: orderBody.referralId } },
          }),
        },
        include: {
          buyer: true,
          fundraiser: {
            select: {
              id: true,
              name: true,
              description: true,
              published: true,
              goalAmount: true,
              imageUrls: true,
              buyingStartsAt: true,
              buyingEndsAt: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  authorized: true,
                  logoUrl: true,
                },
              },
              pickupEvents: {
                orderBy: {
                  startsAt: "asc",
                },
              },
            },
          },
          referral: {
            include: {
              referrer: true,
            },
          },
        },
      });
    },
    { isolationLevel: "Serializable" }
  );

  // Update analytics cache outside transaction
  await updateCacheForNewOrder(orderBody.fundraiserId, order.createdAt);

  return order;
};

export const completeOrderPickup = async (orderId: string) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      pickedUp: true,
    },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          published: true,
          goalAmount: true,
          imageUrls: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
          pickupEvents: {
            orderBy: {
              startsAt: "asc",
            },
          },
        },
      },
      items: {
        select: {
          quantity: true,
          item: {
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              imageUrl: true,
              offsale: true,
            },
          },
        },
      },
      referral: {
        include: {
          referrer: true,
        },
      },
    },
  });

  // Update analytics cache for the fundraiser when an order is picked up, so pending order and picked up order counts are not stale
  await updateCacheForOrderPickup(order.fundraiser.id, order, order.paymentStatus);

  return order;
};

export const confirmOrderPayment = async (orderId: string) => {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "CONFIRMED",
    },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          published: true,
          goalAmount: true,
          imageUrls: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
          pickupEvents: {
            orderBy: {
              startsAt: "asc",
            },
          },
        },
      },
      referral: {
        include: {
          referrer: true,
        },
      },
    },
  });

  return order;
};

/**
 * Calculate the total amount for an order based on its items and quantities
 */
export const calculateOrderTotal = async (
  orderId: string
): Promise<Decimal> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: {
            select: {
              price: true,
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const total = order.items.reduce(
    (sum, orderItem) =>
      sum.plus(
        new Decimal(orderItem.item.price.toString()).times(orderItem.quantity)
      ),
    new Decimal(0)
  );

  return total;
};
