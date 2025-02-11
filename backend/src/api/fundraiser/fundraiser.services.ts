import { prisma } from "../../utils/prisma";
import {
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
} from "./fundraiser.types";

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
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return fundraisers;
};

export const createFundraiser = async (
  fundraiserBody: CreateFundraiserBody
) => {
  const fundraiser = await prisma.fundraiser.create({
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      imageUrls: fundraiserBody.imageUrls,
      startsAt: fundraiserBody.startsAt,
      endsAt: fundraiserBody.endsAt,
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
  fundraiserBody: UpdateFundraiserBody & { fundraiserId: string }
) => {
  const fundraiser = await prisma.fundraiser.update({
    where: {
      id: fundraiserBody.fundraiserId,
    },
    data: {
      name: fundraiserBody.name,
      description: fundraiserBody.description,
      imageUrls: fundraiserBody.imageUrls,
      startsAt: fundraiserBody.startsAt,
      endsAt: fundraiserBody.endsAt,
    },
    include: {
      organization: true,
    },
  });

  return fundraiser;
};

export const createFundraiserItem = async (
  itemBody: CreateFundraiserItemBody & { fundraiserId: string }
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
  itemBody: UpdateFundraiserItemBody & { itemId: string }
) => {
  const item = await prisma.item.update({
    where: {
      id: itemBody.itemId,
    },
    data: {
      name: itemBody.name,
      description: itemBody.description,
      price: itemBody.price,
      imageUrl: itemBody.imageUrl,
      offsale: itemBody.offsale,
    },
  });

  return item;
};
