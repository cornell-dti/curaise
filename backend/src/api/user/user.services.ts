import { prisma } from "../../utils/prisma";
import { UpdateUserBody } from "common";
import z from "zod";

export const getUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  return user;
};

export const getUserOrders = async (userId: string) => {
  const orders = await prisma.order.findMany({
    where: { buyerId: userId },
    include: {
      buyer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          description: true,
          goalAmount: true,
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

export const getUserOrganizations = async (userId: string) => {
  const organizations = await prisma.organization.findMany({
    where: {
      admins: {
        some: {
          id: userId,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return organizations;
};

// TODO: CHECK FOR POSSIBLE BUG (WITH UNDEFINED)
export const updateUser = async (user: z.infer<typeof UpdateUserBody> & { userId: string }) => {
  const updatedUser = await prisma.user.update({
    where: { id: user.userId },
    data: {
      name: user.name,
      venmoUsername: user.venmoUsername,
    },
  });

  return updatedUser;
};
