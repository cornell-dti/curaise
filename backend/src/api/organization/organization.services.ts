import { prisma } from "../../utils/prisma";

export const getOrganization = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      admins: true,
    },
  });

  return organization;
};

export const getOrganizationFundraisers = async (organizationId: string) => {
  const fundraisers = await prisma.fundraiser.findMany({
    where: { organizationId },
    include: {
      organization: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return fundraisers;
};
