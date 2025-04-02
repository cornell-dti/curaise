import { prisma } from "../../utils/prisma";
import { CreateOrganizationBody, UpdateOrganizationBody } from "common";
import { z } from "zod";

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
  organizationBody: z.infer<typeof CreateOrganizationBody> & {
    creatorId: string;
  }
) => {
  const newOrganization = await prisma.organization.create({
    data: {
      name: organizationBody.name,
      description: organizationBody.description,
      logoUrl: organizationBody.logoUrl,
      websiteUrl: organizationBody.websiteUrl,
      instagramUsername: organizationBody.instagramUsername,
      venmoUsername: organizationBody.venmoUsername,

      admins: {
        connect: [
          { id: organizationBody.creatorId },
          ...organizationBody.addedAdminsIds.map((id) => ({ id })),
        ],
      },
    },
    include: {
      admins: true,
    },
  });

  return newOrganization;
};

export const updateOrganization = async (
  organizationBody: z.infer<typeof UpdateOrganizationBody> & {
    organizationId: string;
  }
) => {
  const organization = await prisma.organization.update({
    where: { id: organizationBody.organizationId },
    data: {
      name: organizationBody.name,
      description: organizationBody.description,
      logoUrl: organizationBody.logoUrl,
      websiteUrl: organizationBody.websiteUrl,
      instagramUsername: organizationBody.instagramUsername,
      venmoUsername: organizationBody.venmoUsername,

      admins: {
        connect: organizationBody.addedAdminsIds?.map((id) => ({ id })), // TODO: possible bug
      },
    },
    include: {
      admins: true,
    },
  });

  return organization;
};
