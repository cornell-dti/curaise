import { prisma } from "../../utils/prisma";
import { CreateOrderBody } from "./order.types";

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
          startsAt: true,
          endsAt: true,
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
  orderBody: CreateOrderBody & { buyerId: string }
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
          startsAt: true,
          endsAt: true,
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
          startsAt: true,
          endsAt: true,
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
          startsAt: true,
          endsAt: true,
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
