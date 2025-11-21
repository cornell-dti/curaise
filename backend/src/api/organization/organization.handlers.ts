import { Request, Response } from "express-serve-static-core";
import { OrganizationRouteParams } from "./organization.types";
import {
  getOrganization,
  getOrganizationFundraisers,
  createOrganization,
  updateOrganization,
} from "./organization.services";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteOrganizationSchema,
  CreateOrganizationBody,
  UpdateOrganizationBody,
} from "common";
import { z } from "zod";
import { getUsersByIds, getUser, findUserByEmail } from "../user/user.services";
import { sendOrganizationInviteEmail, sendPendingAdminInviteEmail } from "../../utils/email";

export const getOrganizationHandler = async (
  req: Request<OrganizationRouteParams, any, {}, {}>,
  res: Response
) => {
  const organization = await getOrganization(req.params.id);
  if (!organization) {
    res.status(404).json({ message: "Organization not found" });
    return;
  }

  // remove irrelevant fields from returned order
  const parsedOrganization = CompleteOrganizationSchema.safeParse(organization);
  if (!parsedOrganization.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  const cleanedOrganization = parsedOrganization.data;

  res
    .status(200)
    .json({ message: "Organization retrieved", data: cleanedOrganization });
};

export const getOrganizationFundraisersHandler = async (
  req: Request<OrganizationRouteParams, any, {}, {}>,
  res: Response
) => {
  // ensure organization exists
  const organization = await getOrganization(req.params.id);
  if (!organization) {
    res.status(404).json({ message: "Organization not found" });
    return;
  }

  // only show unpublished fundraisers to admins
  const isAdmin = res.locals.user?.id
    ? organization.admins.some((admin) => admin.id === res.locals.user?.id)
    : false;
  const fundraisers = await getOrganizationFundraisers(req.params.id, isAdmin);

  const parsedFundraisers =
    BasicFundraiserSchema.array().safeParse(fundraisers);
  if (!parsedFundraisers.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  const cleanedFundraisers = parsedFundraisers.data;

  res
    .status(200)
    .json({ message: "Fundraisers retrieved", data: cleanedFundraisers });
};

export const createOrganizationHandler = async (
  req: Request<{}, any, z.infer<typeof CreateOrganizationBody>, {}>,
  res: Response
) => {
  const organization = await createOrganization({
    ...req.body,
    creatorId: res.locals.user!.id,
  });
  if (!organization) {
    res.status(500).json({ message: "Failed to create organization" });
    return;
  }

  // Send email to invited admins
  const creatorId = res.locals.user!.id;
  const creator = await getUser(creatorId);
  if (!creator) {
    res.status(500).json({ message: "Creator user not found" });
    return;
  }

  const addedAdminsEmails = req.body.addedAdminsEmails || [];
  if (addedAdminsEmails.length > 0) {
    try {
      // Separate existing users from pending users
      const existingUserEmails = [];
      const pendingUserEmails = [];

      for (const email of addedAdminsEmails) {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
          existingUserEmails.push(email);
        } else {
          pendingUserEmails.push(email);
        }
      }

      // Send emails to existing users
      if (existingUserEmails.length > 0) {
        const invitedAdmins = [];
        for (const email of existingUserEmails) {
          const user = await findUserByEmail(email);
          if (user) invitedAdmins.push(user);
        }

        if (invitedAdmins.length > 0) {
          await sendOrganizationInviteEmail({
            organization: organization,
            creator,
            invitedAdmins,
          });
          console.log(`Invitation emails sent to ${invitedAdmins.length} existing users`);
        }
      }

      // Send emails to pending users
      if (pendingUserEmails.length > 0) {
        await sendPendingAdminInviteEmail({
          organization: organization,
          creator,
          pendingAdminEmails: pendingUserEmails,
        });
        console.log(`Pending invitation emails sent to ${pendingUserEmails.length} users`);
      }
    } catch (error) {
      console.error("Failed to send admin invitation emails:", error);
    }
  }

  // Remove irrelevant fields from returned order
  const parsedOrganization = BasicOrganizationSchema.safeParse(organization);
  if (!parsedOrganization.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  const cleanedOrganization = parsedOrganization.data;

  // TODO: send email to curaise internal people for further verification of organization

  res
    .status(200)
    .json({ message: "Organization created", data: cleanedOrganization });
};

export const updateOrganizationHandler = async (
  req: Request<
    OrganizationRouteParams,
    any,
    z.infer<typeof UpdateOrganizationBody>,
    {}
  >,
  res: Response
) => {
  const organization = await getOrganization(req.params.id);
  if (!organization) {
    res.status(404).json({ message: "Organization not found" });
    return;
  }
  if (!organization.admins.some((admin) => admin.id === res.locals.user!.id)) {
    res.status(403).json({ message: "Unauthorized to update organization" });
    return;
  }

  const updatedOrganization = await updateOrganization({
    organizationId: req.params.id,
    ...req.body,
  });
  if (!updatedOrganization) {
    res.status(500).json({ message: "Failed to update organization" });
    return;
  }

  // Send email to invited admins
  const creatorId = res.locals.user!.id;
  const creator = await getUser(creatorId);
  if (!creator) {
    res.status(500).json({ message: "Creator user not found" });
    return;
  }

  const addedAdminsEmails = req.body.addedAdminsEmails || [];
  if (addedAdminsEmails.length > 0) {
    try {
      // Separate existing users from pending users
      const existingUserEmails = [];
      const pendingUserEmails = [];

      for (const email of addedAdminsEmails) {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
          existingUserEmails.push(email);
        } else {
          pendingUserEmails.push(email);
        }
      }

      // Send emails to existing users
      if (existingUserEmails.length > 0) {
        const invitedAdmins = [];
        for (const email of existingUserEmails) {
          const user = await findUserByEmail(email);
          if (user) invitedAdmins.push(user);
        }

        if (invitedAdmins.length > 0) {
          await sendOrganizationInviteEmail({
            organization: organization,
            creator,
            invitedAdmins,
          });
          console.log(`Invitation emails sent to ${invitedAdmins.length} existing users`);
        }
      }

      // Send emails to pending users
      if (pendingUserEmails.length > 0) {
        await sendPendingAdminInviteEmail({
          organization: organization,
          creator,
          pendingAdminEmails: pendingUserEmails,
        });
        console.log(`Pending invitation emails sent to ${pendingUserEmails.length} users`);
      }
    } catch (error) {
      console.error("Failed to send admin invitation emails:", error);
    }
  }

  // Remove irrelevant fields from returned order
  const parsedOrganization =
    CompleteOrganizationSchema.safeParse(updatedOrganization);
  if (!parsedOrganization.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }
  const cleanedOrganization = parsedOrganization.data;

  res
    .status(200)
    .json({ message: "Organization updated", data: cleanedOrganization });
};
