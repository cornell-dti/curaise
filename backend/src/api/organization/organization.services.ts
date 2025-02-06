import { prisma } from "../../utils/prisma";
import { CreateOrganizationBody } from "./organization.types";

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

// TODO: CHECK FOR POSSIBLE BUG
export const createOrganization = async (
  organizationBody: CreateOrganizationBody & { creatorId: string }
) => {
  const newOrganization = await prisma.organization.create({
    data: {
      name: organizationBody.name,
      description: organizationBody.description,
      logoUrl: organizationBody.logoUrl,
      websiteUrl: organizationBody.websiteUrl,
      instagramUsername: organizationBody.instagramUsername,
      venmoUsername: organizationBody.venmoUsername,

      admins: { connect: { id: organizationBody.creatorId } },
    },
    include: {
      admins: true,
    },
  });

  return newOrganization;
};
