import { prisma } from "../../utils/prisma";
import { CreateOrganizationBody, UpdateOrganizationBody } from "common";
import { z } from "zod";
import { findUserByEmail } from "../user/user.services";

export const getOrganization = async (organizationId: string) => {
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      admins: true,
    },
  });

  return organization;
};

export const getOrganizationFundraisers = async (
  organizationId: string,
  includeUnpublished: boolean
) => {
  const fundraisers = await prisma.fundraiser.findMany({
    where: {
      organizationId,
      published: includeUnpublished ? undefined : true,
    },
    include: {
      organization: true,
      pickupEvents: {
        orderBy: {
          startsAt: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return fundraisers;
};

export const upsertPendingUser = async (email: string) => {
  const pendingUser = await prisma.pendingUser.upsert({
    where: { email },
    update: {},
    create: { email },
  });

  return pendingUser;
};

export const createOrganization = async (
  organizationBody: z.infer<typeof CreateOrganizationBody> & {
    creatorId: string;
  }
) => {
  // Process emails to determine which are existing users vs pending users
  const adminUsers = [];
  const pendingAdminUsers = [];

  for (const email of organizationBody.addedAdminsEmails) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      adminUsers.push({ id: existingUser.id });
    } else {
      const pendingUser = await upsertPendingUser(email);
      pendingAdminUsers.push({ id: pendingUser.id });
    }
  }

  const newOrganization = await prisma.organization.create({
    data: {
      name: organizationBody.name,
      description: organizationBody.description,
      logoUrl: organizationBody.logoUrl,
      websiteUrl: organizationBody.websiteUrl,
      instagramUsername: organizationBody.instagramUsername,

      admins: {
        connect: [{ id: organizationBody.creatorId }, ...adminUsers],
      },
      pendingAdmins: {
        connect: pendingAdminUsers,
      },
    },
    include: {
      admins: true,
      pendingAdmins: true,
    },
  });

  return newOrganization;
};

export const updateOrganization = async (
  organizationBody: z.infer<typeof UpdateOrganizationBody> & {
    organizationId: string;
  }
) => {
  // Process emails to determine which are existing users vs pending users
  const adminUsers = [];
  const pendingAdminUsers = [];

  for (const email of organizationBody.addedAdminsEmails) {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      adminUsers.push({ id: existingUser.id });
    } else {
      const pendingUser = await upsertPendingUser(email);
      pendingAdminUsers.push({ id: pendingUser.id });
    }
  }

  const organization = await prisma.organization.update({
    where: { id: organizationBody.organizationId },
    data: {
      name: organizationBody.name,
      description: organizationBody.description,
      logoUrl: organizationBody.logoUrl ?? null,
      websiteUrl: organizationBody.websiteUrl ?? null,
      instagramUsername: organizationBody.instagramUsername ?? null,

      admins: {
        connect: adminUsers,
      },
      pendingAdmins: {
        connect: pendingAdminUsers,
      },
    },
    include: {
      admins: true,
      pendingAdmins: true,
    },
  });

  return organization;
};
