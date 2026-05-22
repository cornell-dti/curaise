import { Request, Response } from "express-serve-static-core";
import {
  getAllOrganizations,
  updateOrganizationAuthorized,
} from "./admin.services";
import {
  AdminOrganizationSchema,
  UpdateOrganizationAuthorizedBody,
} from "common";
import { z } from "zod";

interface OrganizationParams {
  id: string;
}

export const verifyAdminHandler = async (_req: Request, res: Response) => {
  res.status(200).json({ message: "Admin verified", data: { isAdmin: true } });
};

export const getAllOrganizationsHandler = async (
  _req: Request,
  res: Response,
) => {
  const organizations = await getAllOrganizations();

  const parsed = AdminOrganizationSchema.array().safeParse(organizations);
  if (!parsed.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }

  res
    .status(200)
    .json({ message: "Organizations retrieved", data: parsed.data });
};

export const updateOrganizationAuthorizedHandler = async (
  req: Request<
    OrganizationParams,
    any,
    z.infer<typeof UpdateOrganizationAuthorizedBody>,
    {}
  >,
  res: Response,
) => {
  const organization = await updateOrganizationAuthorized(
    req.params.id,
    req.body.authorized,
  );

  const parsed = AdminOrganizationSchema.safeParse(organization);
  if (!parsed.success) {
    res.status(500).json({ message: "Internal server error" });
    return;
  }

  res
    .status(200)
    .json({ message: "Organization authorization updated", data: parsed.data });
};
