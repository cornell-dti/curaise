import { prisma } from "../../utils/prisma";
import { CreateOrderBody } from "common";
import { z } from "zod";
import { updateCacheForNewOrder, updateCacheForOrderPickup } from "../fundraiser/fundraiser.services";

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
          goalAmount: true,
          imageUrls: true,
          pickupLocation: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          pickupStartsAt: true,
          pickupEndsAt: true,
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
        },
      },
      items: {
        select: { quantity: true, item: true },
      },
    },
  });

  return order;
};

export const createOrder = async (
  orderBody: z.infer<typeof CreateOrderBody> & { buyerId: string }
) => {
  const order = await prisma.order.create({
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
    },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          goalAmount: true,
          imageUrls: true,
          pickupLocation: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          pickupStartsAt: true,
          pickupEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  // Update analytics cache for the fundraiser when a new order is created
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
          goalAmount: true,
          imageUrls: true,
          pickupLocation: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          pickupStartsAt: true,
          pickupEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
        },
      },
      items: {
        select: { quantity: true, item: true },
      },
    },
  });

  // Update analytics cache for the fundraiser when an order is picked up, so pending order and picked up order counts are not stale
  await updateCacheForOrderPickup(order.fundraiser.id, order);

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
          goalAmount: true,
          imageUrls: true,
          pickupLocation: true,
          buyingStartsAt: true,
          buyingEndsAt: true,
          pickupStartsAt: true,
          pickupEndsAt: true,
          organization: {
            select: {
              id: true,
              name: true,
              description: true,
              authorized: true,
              logoUrl: true,
            },
          },
        },
      },
    },
  });

  return order;
};
