import { Request, Response } from "express-serve-static-core";
import {
  CreateFundraiserBody,
  FundraiserRouteParams,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  FundraiserItemRouteParams,
  CreateAnnouncementBody,
  DeleteAnnouncementRouteParams,
} from "./fundraiser.types";
import {
  createFundraiser,
  getAllFundraisers,
  getFundraiser,
  getFundraiserItems,
  getFundraiserOrders,
  updateFundraiser,
  createFundraiserItem,
  updateFundraiserItem,
  createAnnouncement,
  deleteAnnouncement,
} from "./fundraiser.services";
import {
  AnnouncementSchema,
  BasicFundraiserSchema,
  CompleteOrderSchema,
  CompleteFundraiserSchema,
  CompleteItemSchema,
} from "common";
import { getOrganization } from "../organization/organization.services";

export const getAllFundraisersHandler = async (req: Request, res: Response) => {
  const fundraisers = await getAllFundraisers();
  if (!fundraisers) {
    res.status(404).json({ message: "Fundraisers not found" });
    return;
  }

  const parsedFundraisers =
    BasicFundraiserSchema.array().safeParse(fundraisers);
  if (!parsedFundraisers.success) {
    res.status(500).json({ message: "Couldn't parse fundraisers" });
    return;
  }
  const cleanedFundraisers = parsedFundraisers.data;

  res
    .status(200)
    .json({ message: "Fundraisers retrieved", data: cleanedFundraisers });
};

export const getFundraiserHandler = async (
  req: Request<FundraiserRouteParams, any, {}, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  const parsedFundraiser = CompleteFundraiserSchema.safeParse(fundraiser);
  if (!parsedFundraiser.success) {
    res.status(500).json({ message: "Couldn't parse fundraiser" });
    return;
  }
  const cleanedFundraiser = parsedFundraiser.data;

  res
    .status(200)
    .json({ message: "Fundraiser retrieved", data: cleanedFundraiser });
};

export const getFundraiserItemsHandler = async (
  req: Request<FundraiserRouteParams, any, {}, {}>,
  res: Response
) => {
  const items = await getFundraiserItems(req.params.id);
  if (!items) {
    res.status(404).json({ message: "Items not found" });
    return;
  }

  // remove irrelevant fields
  const parsedItems = CompleteItemSchema.array().safeParse(items);
  if (!parsedItems.success) {
    res.status(500).json({ message: "Couldn't parse items" });
    return;
  }
  const cleanedItems = parsedItems.data;

  res.status(200).json({ message: "Items retrieved", data: cleanedItems });
};

export const getFundraiserOrdersHandler = async (
  req: Request<FundraiserRouteParams, any, {}, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to view fundraiser orders" });
    return;
  }

  const orders = await getFundraiserOrders(req.params.id);
  if (!orders) {
    res.status(404).json({ message: "Orders not found" });
    return;
  }

  // remove irrelevant fields
  const parsedOrders = CompleteOrderSchema.array().safeParse(orders);
  if (!parsedOrders.success) {
    res.status(500).json({ message: "Couldn't parse orders" });
    return;
  }
  const cleanedOrders = parsedOrders.data;

  res
    .status(200)
    .json({ message: "Orders retrieved", data: { cleanedOrders } });
};

export const createFundraiserHandler = async (
  req: Request<{}, any, CreateFundraiserBody, {}>,
  res: Response
) => {
  const organization = await getOrganization(req.body.organizationId);
  if (!organization) {
    res.status(404).json({ message: "Organization not found" });
    return;
  }

  // Check if user is admin of organization
  if (!organization.admins.some((admin) => admin.id === res.locals.user!.id)) {
    res.status(403).json({ message: "Unauthorized to create fundraiser" });
    return;
  }

  const fundraiser = await createFundraiser(req.body);
  if (!fundraiser) {
    res.status(500).json({ message: "Failed to create fundraiser" });
    return;
  }

  // remove irrelevant fields
  const parsedFundraiser = BasicFundraiserSchema.safeParse(fundraiser);
  if (!parsedFundraiser.success) {
    res.status(500).json({ message: "Couldn't parse fundraiser" });
    return;
  }
  const cleanedFundraiser = parsedFundraiser.data;

  res.status(200).json({
    message: "Successfully created fundraiser",
    data: cleanedFundraiser,
  });
};

export const updateFundraiserHandler = async (
  req: Request<FundraiserRouteParams, any, UpdateFundraiserBody, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to update fundraiser" });
    return;
  }

  const updatedFundraiser = await updateFundraiser({
    fundraiserId: req.params.id,
    ...req.body,
  });
  if (!updatedFundraiser) {
    res.status(500).json({ message: "Failed to update fundraiser" });
    return;
  }

  // remove irrelevant fields
  const parsedFundraiser = BasicFundraiserSchema.safeParse(updatedFundraiser);
  if (!parsedFundraiser.success) {
    res.status(500).json({ message: "Couldn't parse fundraiser" });
    return;
  }
  const cleanedFundraiser = parsedFundraiser.data;

  res.status(200).json({
    message: "Successfully updated fundraiser",
    data: cleanedFundraiser,
  });
};

export const createFundraiserItemHandler = async (
  req: Request<FundraiserRouteParams, any, CreateFundraiserItemBody, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to create fundraiser item" });
    return;
  }

  const item = await createFundraiserItem({
    fundraiserId: req.params.id,
    ...req.body,
  });
  if (!item) {
    res.status(500).json({ message: "Failed to create fundraiser item" });
    return;
  }

  // remove irrelevant fields
  const parsedItem = CompleteItemSchema.safeParse(item);
  if (!parsedItem.success) {
    res.status(500).json({ message: "Couldn't parse item" });
    return;
  }
  const cleanedItem = parsedItem.data;

  res.status(200).json({
    message: "Successfully created fundraiser item",
    data: cleanedItem,
  });
};

export const updateFundraiserItemHandler = async (
  req: Request<FundraiserItemRouteParams, any, UpdateFundraiserItemBody, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.fundraiserId);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to update fundraiser item" });
    return;
  }

  const item = await updateFundraiserItem({
    itemId: req.params.itemId,
    ...req.body,
  });
  if (!item) {
    res.status(500).json({ message: "Failed to update fundraiser item" });
    return;
  }

  // remove irrelevant fields
  const parsedItem = CompleteItemSchema.safeParse(item);
  if (!parsedItem.success) {
    res.status(500).json({ message: "Couldn't parse item" });
    return;
  }
  const cleanedItem = parsedItem.data;

  res.status(200).json({
    message: "Successfully updated fundraiser item",
    data: cleanedItem,
  });
};

export const createAnnouncementHandler = async (
  req: Request<FundraiserRouteParams, any, CreateAnnouncementBody, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res
      .status(403)
      .json({ message: "Unauthorized to create fundraiser announcement" });
    return;
  }

  const announcement = await createAnnouncement({
    fundraiserId: req.params.id,
    ...req.body,
  });
  if (!announcement) {
    res.status(500).json({ message: "Failed to create announcement" });
    return;
  }

  // TODO: SEND EMAIL WHEN CREATING ANNOUNCEMENT

  // remove irrelevant fields
  const parsedAnnouncement = AnnouncementSchema.safeParse(announcement);
  if (!parsedAnnouncement.success) {
    res.status(500).json({ message: "Couldn't parse announcement" });
    return;
  }
  const cleanedAnnouncement = parsedAnnouncement.data;

  res.status(200).json({
    message: "Successfully created announcement",
    data: cleanedAnnouncement,
  });
};

export const deleteAnnouncementHandler = async (
  req: Request<DeleteAnnouncementRouteParams, any, {}, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.params.fundraiserId);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to delete announcement" });
    return;
  }

  const announcement = await deleteAnnouncement(req.params.announcementId);
  if (!announcement) {
    res.status(500).json({ message: "Failed to delete announcement" });
    return;
  }

  res.status(200).json({ message: "Successfully deleted announcement" });
};
