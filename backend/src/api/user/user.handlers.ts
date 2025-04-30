import { Request, Response } from "express-serve-static-core";
import { UserRouteParams, UserSearchQueryParams } from "./user.types";
import {
  findUserByEmail,
  getUser,
  getUserOrders,
  getUserOrganizations,
  updateUser,
} from "./user.services";
import {
  UserSchema,
  BasicOrderSchema,
  BasicOrganizationSchema,
  UpdateUserBody,
} from "common";
import { z } from "zod";

export const getUserHandler = async (
  req: Request<UserRouteParams, any, {}, {}>,
  res: Response
) => {
  const user = await getUser(req.params.id);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const parsedUser = UserSchema.safeParse(user);
  if (!parsedUser.success) {
    res.status(500).json({ message: "Couldn't parse user" });
    return;
  }
  const cleanedUser = parsedUser.data;

  res.status(200).json({ message: "User retrieved", data: cleanedUser });
};

export const getUserOrdersHandler = async (
  req: Request<UserRouteParams, any, {}, {}>,
  res: Response
) => {
  if (res.locals.user!.id !== req.params.id) {
    res.status(403).json({ message: "Unauthorized to view user orders" });
    return;
  }

  const orders = await getUserOrders(req.params.id);
  if (!orders) {
    res.status(404).json({ message: "Orders not found" });
    return;
  }

  // remove irrelevant fields
  const parsedOrders = BasicOrderSchema.array().safeParse(orders);
  if (!parsedOrders.success) {
    res.status(500).json({ message: "Failed to parse orders" });
    return;
  }
  const cleanedOrders = parsedOrders.data;

  res.status(200).json({ message: "Orders retrieved", data: cleanedOrders });
};

export const getUserOrganizationsHandler = async (
  req: Request<UserRouteParams, any, {}, {}>,
  res: Response
) => {
  if (res.locals.user!.id !== req.params.id) {
    res
      .status(403)
      .json({ message: "Unauthorized to view user organizations" });
    return;
  }

  const organizations = await getUserOrganizations(req.params.id);
  if (!organizations) {
    res.status(404).json({ message: "Organizations not found" });
    return;
  }

  // remove irrelevant fields
  const parsedOrganizations =
    BasicOrganizationSchema.array().safeParse(organizations);
  if (!parsedOrganizations.success) {
    res.status(500).json({ message: "Couldn't parse organizations" });
    return;
  }
  const cleanedOrganizations = parsedOrganizations.data;

  res
    .status(200)
    .json({ message: "Organizations retrieved", data: cleanedOrganizations });
};

export const updateUserHandler = async (
  req: Request<UserRouteParams, any, z.infer<typeof UpdateUserBody>, {}>,
  res: Response
) => {
  if (res.locals.user!.id !== req.params.id) {
    res.status(403).json({ message: "Unauthorized to update user" });
    return;
  }

  const user = await updateUser({
    userId: req.params.id,
    ...req.body,
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const parsedUser = UserSchema.safeParse(user);
  if (!parsedUser.success) {
    res.status(500).json({ message: "Couldn't parse user" });
    return;
  }
  const cleanedUser = parsedUser.data;

  res.status(200).json({ message: "User updated", data: cleanedUser });
};

export const findUserByEmailHandler = async (
  req: Request<{}, {}, {}, UserSearchQueryParams>,
  res: Response
) => {
  const user = await findUserByEmail(req.query.email);
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const parsedUser = UserSchema.safeParse(user);
  if (!parsedUser.success) {
    res.status(500).json({ message: "Couldn't parse user" });
    return;
  }
  const cleanedUser = parsedUser.data;

  res.status(200).json({ message: "User retrieved", data: cleanedUser });
};
