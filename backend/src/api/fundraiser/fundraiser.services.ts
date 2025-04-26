import { prisma } from "../../utils/prisma";
import {
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  CreateAnnouncementBody,
} from "common";
import { z } from "zod";

export const getFundraiser = async (fundraiserId: string) => {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: {
      id: fundraiserId,
    },
    include: {
      organization: {
        include: {
          admins: {
            select: {
              id: true,
            },
          },
        },
      },
      announcements: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  return fundraiser;
};

export const getFundraiserItems = async (fundraiserId: string) => {
  const items = await prisma.item.findMany({
    where: {
      fundraiserId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return items;
};

export const getFundraiserOrders = async (fundraiserId: string) => {
  const orders = await prisma.order.findMany({
    where: {
      fundraiserId,
    },
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
      items: {
        select: { quantity: true, item: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

export const getAllFundraisers = async () => {
  const fundraisers = await prisma.fundraiser.findMany({
    include: {
      organization: true,
      announcements: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return fundraisers;
};

export const createFundraiser = async (
  fundraiserBody: z.infer<typeof CreateFundraiserBody>
) => {
  const fundraiser = await prisma.fundraiser.create({
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      goalAmount: fundraiserBody.goalAmount,
      pickupLocation: fundraiserBody.pickupLocation,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
      pickupStartsAt: fundraiserBody.pickupStartsAt,
      pickupEndsAt: fundraiserBody.pickupEndsAt,
      organization: {
        connect: {
          id: fundraiserBody.organizationId,
        },
      },
    },
    include: {
      organization: true,
    },
  });

  return fundraiser;
};

export const updateFundraiser = async (
  fundraiserBody: z.infer<typeof UpdateFundraiserBody> & {
    fundraiserId: string;
  }
) => {
  const fundraiser = await prisma.fundraiser.update({
    where: {
      id: fundraiserBody.fundraiserId,
    },
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      goalAmount: fundraiserBody.goalAmount ?? null,
      pickupLocation: fundraiserBody.pickupLocation,
      imageUrls: fundraiserBody.imageUrls,
      buyingStartsAt: fundraiserBody.buyingStartsAt,
      buyingEndsAt: fundraiserBody.buyingEndsAt,
      pickupStartsAt: fundraiserBody.pickupStartsAt,
      pickupEndsAt: fundraiserBody.pickupEndsAt,
    },
    include: {
      organization: true,
    },
  });

  return fundraiser;
};

export const createFundraiserItem = async (
  itemBody: z.infer<typeof CreateFundraiserItemBody> & { fundraiserId: string }
) => {
  const item = await prisma.item.create({
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      imageUrl: itemBody.imageUrl,
      fundraiser: {
        connect: {
          id: itemBody.fundraiserId,
        },
      },
    },
  });

  return item;
};

export const updateFundraiserItem = async (
  itemBody: z.infer<typeof UpdateFundraiserItemBody> & { itemId: string }
) => {
  const item = await prisma.item.update({
    where: {
      id: itemBody.itemId,
    },
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      imageUrl: itemBody.imageUrl ?? null,
      offsale: itemBody.offsale,
    },
  });

  return item;
};

export const createAnnouncement = async (
  announcementBody: z.infer<typeof CreateAnnouncementBody> & {
    fundraiserId: string;
  }
) => {
  const announcement = await prisma.announcement.create({
    data: {
      message: announcementBody.message,
      fundraiser: {
        connect: {
          id: announcementBody.fundraiserId,
        },
      },
    },
  });

  return announcement;
};

export const deleteAnnouncement = async (announcementId: string) => {
  const announcement = await prisma.announcement.delete({
    where: {
      id: announcementId,
    },
  });

  return announcement;
};
