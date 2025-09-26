import { prisma } from "../../utils/prisma";
import { CreateOrderBody } from "common";
import { z } from "zod";

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
    },
  });

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

/**
 * Calculate the total amount for an order based on its items and quantities
 */
export const calculateOrderTotal = async (orderId: string): Promise<number> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  const total = order.items.reduce((sum, orderItem) => {
    const itemPrice = parseFloat(orderItem.item.price.toString());
    return sum + itemPrice * orderItem.quantity;
  }, 0);

  return total;
};
