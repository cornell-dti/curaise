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
import { emailService } from "../../utils/email";
import { getUsersByIds, getUser } from "../user/user.services";

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

  const fundraisers = await getOrganizationFundraisers(req.params.id);

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

  const addedAdminsIds = req.body.addedAdminsIds || [];
  if (addedAdminsIds.length > 0) {
    try {
      const invitedAdmins = await getUsersByIds(addedAdminsIds);

      if (invitedAdmins && invitedAdmins.length > 0) {
        await emailService.sendOrganizationInviteEmail({
          organization: organization,
          creator,
          invitedAdmins,
        });

        console.log(`Invitation emails sent to ${invitedAdmins.length} admins`);
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
