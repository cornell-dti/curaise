import { prisma } from "../../utils/prisma";

export const getAllOrganizations = async () => {
  const organizations = await prisma.organization.findMany({
    include: {
      admins: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return organizations;
};

export const updateOrganizationAuthorized = async (
  organizationId: string,
  authorized: boolean,
) => {
  const organization = await prisma.organization.update({
    where: { id: organizationId },
    data: { authorized },
    include: {
      admins: true,
    },
  });

  return organization;
};
