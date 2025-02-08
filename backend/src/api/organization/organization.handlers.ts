import { Request, Response } from "express-serve-static-core";
import {
  OrganizationRouteParams,
  CreateOrganizationBody,
} from "./organization.types";
import {
  getOrganization,
  getOrganizationFundraisers,
  createOrganization,
} from "./organization.services";
import {
  BasicFundraiserSchema,
  BasicOrganizationSchema,
  CompleteOrganizationSchema,
} from "common";

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
    .json({ message: "Order retrieved", data: cleanedOrganization });
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
  req: Request<{}, any, CreateOrganizationBody, {}>,
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
