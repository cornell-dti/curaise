import { prisma } from "../../utils/prisma";

export const getReferral = async (referralId: string) => {
  const referral = await prisma.referral.findUnique({
    where: { id: referralId },
    include: {
      referrer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
          organization: {
            select: {
              id: true,
              admins: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  return referral;
};

export const createReferral = async (referralBody: {
  fundraiserId: string;
  referrerId: string;
}) => {
  try {
    const referral = await prisma.referral.create({
      data: {
        fundraiser: { connect: { id: referralBody.fundraiserId } },
        referrer: { connect: { id: referralBody.referrerId } },
      },
      include: {
        referrer: true,
        fundraiser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return referral;
  } catch (error) {
    // Handle unique constraint violation
    if ((error as any).code === "P2002") {
      return null; // Duplicate referral request
    }
    throw error;
  }
};

export const approveReferral = async (referralId: string) => {
  const referral = await prisma.referral.update({
    where: { id: referralId },
    data: { approved: true },
    include: {
      referrer: true,
      fundraiser: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return referral;
};

export const getReferrersForFundraiser = async (fundraiserId: string) => {
  const referrals = await prisma.referral.findMany({
    where: {
      fundraiserId: fundraiserId,
    },
    include: {
      referrer: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return referrals;
};
