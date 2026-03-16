import { Prisma } from "../../generated/client";
import { prisma } from "../../utils/prisma";
import { CreateOrderBody } from "common";
import { z } from "zod";
import {
  updateCacheForNewOrder,
  updateCacheForOrderPickup,
} from "../fundraiser/fundraiser.services";
import { Decimal } from "decimal.js";

const getConfirmedCountsByItem = async (
  tx: Prisma.TransactionClient,
  itemIds: string[],
  excludeOrderId?: string
) => {
  if (itemIds.length === 0) {
    return new Map<string, number>();
  }

  const results = await tx.orderItems.groupBy({
    by: ["itemId"],
    where: {
      itemId: { in: itemIds },
      ...(excludeOrderId
        ? {
            orderId: { not: excludeOrderId },
          }
        : {}),
      order: {
        OR: [{ paymentStatus: "CONFIRMED" }, { pickedUp: true }],
      },
    },
    _sum: { quantity: true },
  });

  const counts = new Map<string, number>();
  itemIds.forEach((id) => counts.set(id, 0));
  results.forEach((result) => {
    counts.set(result.itemId, result._sum.quantity ?? 0);
  });

  return counts;
};

const mergeRequestedItemsByItemId = <
  T extends { itemId: string; quantity: number },
>(
  requestedItems: T[]
): T[] => {
  const requestedItemsById = new Map<string, number>();

  requestedItems.forEach((requestedItem) => {
    requestedItemsById.set(
      requestedItem.itemId,
      (requestedItemsById.get(requestedItem.itemId) ?? 0) +
        requestedItem.quantity
    );
  });

  return Array.from(requestedItemsById.entries()).map(([itemId, quantity]) => ({
    itemId,
    quantity,
  })) as T[];
};

const assertInventoryAvailable = async (
  tx: Prisma.TransactionClient,
  requestedItems: { itemId: string; quantity: number }[],
  excludeOrderId?: string
) => {
  const mergedRequestedItems = mergeRequestedItemsByItemId(requestedItems);
  const itemIds = mergedRequestedItems.map((item) => item.itemId);
  const items = await tx.item.findMany({
    where: { id: { in: itemIds } },
    select: { id: true, limit: true, name: true },
  });
  const confirmedCounts = await getConfirmedCountsByItem(
    tx,
    itemIds,
    excludeOrderId
  );

  for (const orderItem of mergedRequestedItems) {
    const item = items.find((i) => i.id === orderItem.itemId);
    if (!item) {
      throw new Error(`Item ${orderItem.itemId} not found`);
    }

    if (item.limit === null) {
      continue;
    }

    const confirmedCount = confirmedCounts.get(orderItem.itemId) ?? 0;
    const newTotal = confirmedCount + orderItem.quantity;
    if (newTotal > item.limit) {
      const available = Math.max(0, item.limit - confirmedCount);
      throw new Error(
        `Insufficient stock for ${item.name}. Available: ${available}, Requested: ${orderItem.quantity}`
      );
    }
  }
};

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
  orderBody: z.infer<typeof CreateOrderBody> & { buyerId: string },
) => {
  const mergedOrderItems = mergeRequestedItemsByItemId(orderBody.items);

  const order = await prisma.$transaction(
    async (tx) => {
      await assertInventoryAvailable(tx, mergedOrderItems);

      return tx.order.create({
        data: {
          paymentMethod: orderBody.payment_method,
          paymentStatus:
            orderBody.payment_method === "VENMO" ? "PENDING" : "UNVERIFIABLE",
          buyer: { connect: { id: orderBody.buyerId } },
          fundraiser: { connect: { id: orderBody.fundraiserId } },
          items: {
            create: mergedOrderItems.map((item) => ({
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
  const order = await prisma.$transaction(
    async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          paymentStatus: true,
          pickedUp: true,
          items: {
            select: {
              quantity: true,
              itemId: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      const isAlreadyCountedAgainstCap =
        existingOrder.paymentStatus === "CONFIRMED" || existingOrder.pickedUp;

      if (!isAlreadyCountedAgainstCap) {
        await assertInventoryAvailable(
          tx,
          existingOrder.items.map((item) => ({
            itemId: item.itemId,
            quantity: item.quantity,
          })),
          orderId
        );
      }

      return tx.order.update({
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
    },
    { isolationLevel: "Serializable" }
  );

  // Update analytics cache for the fundraiser when an order is picked up, so pending order and picked up order counts are not stale
  await updateCacheForOrderPickup(
    order.fundraiser.id,
    order,
    order.paymentStatus,
  );

  return order;
};

export const undoOrderPickup = async (orderId: string) => {
  const existingOrder = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      pickedUp: true,
      updatedAt: true,
      fundraiser: { select: { id: true } },
      paymentStatus: true,
    },
  });

  // If order doesn't exist, or isn't picked up already
  if (!existingOrder || !existingOrder.pickedUp) return null;

  const nowMs = Date.now();
  const pickedUpAtMs = new Date(existingOrder.updatedAt).getTime();
  const elapsedMs = nowMs - pickedUpAtMs;
  // After 1 minute, order can no longer be undone
  if (elapsedMs > 60_000) return null;

  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      pickedUp: false,
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
  await updateCacheForOrderPickup(
    order.fundraiser.id,
    order,
    order.paymentStatus,
  );

  return order;
};

export const confirmOrderPayment = async (orderId: string) => {
  const order = await prisma.$transaction(
    async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            select: {
              quantity: true,
              itemId: true,
            },
          },
        },
      });

      if (!existingOrder) {
        throw new Error("Order not found");
      }

      await assertInventoryAvailable(
        tx,
        existingOrder.items.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
        })),
        orderId
      );

      return tx.order.update({
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
    },
    { isolationLevel: "Serializable" }
  );

  return order;
};

/**
 * Find unpaid orders created 1-2 hours ago
 */
export const getUnremindedUnpaidOrders = async () => {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

  return prisma.order.findMany({
    where: {
      paymentStatus: "PENDING",
      paymentMethod: "VENMO",
      createdAt: {
        gte: twoHoursAgo,
        lte: oneHourAgo,
      },
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
    },
  });
};

/**
 * Calculate the total amount for an order based on its items and quantities
 */
export const calculateOrderTotal = async (
  orderId: string,
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
        new Decimal(orderItem.item.price.toString()).times(orderItem.quantity),
      ),
    new Decimal(0),
  );

  return total;
};
