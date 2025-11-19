import { Request, Response } from "express-serve-static-core";
import {
  FundraiserRouteParams,
  FundraiserItemRouteParams,
  DeleteAnnouncementRouteParams,
  PickupEventRouteParams,
  ApproveReferralRouteParams,
} from "./fundraiser.types";
import {
  createFundraiser,
  getAllFundraisers,
  getFundraiser,
  getFundraiserItems,
  getFundraiserOrders,
  updateFundraiser,
  createFundraiserItem,
  getFundraiserItem,
  updateFundraiserItem,
  deleteFundraiserItem,
  createAnnouncement,
  deleteAnnouncement,
  getFundraiserAnalytics,
  publishFundraiser,
  createPickupEvent,
  updatePickupEvent,
  deletePickupEvent,
  createReferral,
  getReferral,
  approveReferral,
} from "./fundraiser.services";
import {
  AnnouncementSchema,
  BasicFundraiserSchema,
  CompleteOrderSchema,
  CompleteFundraiserSchema,
  CompleteItemSchema,
  CreateFundraiserBody,
  UpdateFundraiserBody,
  CreateFundraiserItemBody,
  UpdateFundraiserItemBody,
  CreateAnnouncementBody,
  CreatePickupEventBody,
  UpdatePickupEventBody,
  ReferralSchema,
} from "common";
import { getOrganization } from "../organization/organization.services";
import { z } from "zod";
import { sendAnnouncementEmail, sendVenmoSetupEmail } from "../../utils/email";

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

  res.status(200).json({ message: "Orders retrieved", data: cleanedOrders });
};

export const createFundraiserHandler = async (
  req: Request<{}, any, z.infer<typeof CreateFundraiserBody>, {}>,
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

  // Send Venmo setup email if venmoEmail is provided
  if (req.body.venmoEmail) {
    try {
      await sendVenmoSetupEmail({
        venmoEmail: req.body.venmoEmail,
        fundraiserName: fundraiser.name,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send Venmo setup email" });
      return;
    }
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
  req: Request<
    FundraiserRouteParams,
    any,
    z.infer<typeof UpdateFundraiserBody>,
    {}
  >,
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

  if (fundraiser.published) {
    res.status(400).json({ message: "Cannot update a published fundraiser" });
    return;
  }

  // Check if venmoEmail was edited
  const venmoEmailEdited =
    req.body.venmoEmail && req.body.venmoEmail !== fundraiser.venmoEmail;

  const updatedFundraiser = await updateFundraiser({
    fundraiserId: req.params.id,
    ...req.body,
  });
  if (!updatedFundraiser) {
    res.status(500).json({ message: "Failed to update fundraiser" });
    return;
  }

  // Send Venmo setup email if venmoEmail was edited
  if (venmoEmailEdited) {
    try {
      await sendVenmoSetupEmail({
        venmoEmail: req.body.venmoEmail!,
        fundraiserName: updatedFundraiser.name,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to send Venmo setup email" });
      return;
    }
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

export const publishFundraiserHandler = async (
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
    res.status(403).json({ message: "Unauthorized to update fundraiser" });
    return;
  }

  if (fundraiser.published) {
    res.status(400).json({ message: "Fundraiser is already published" });
    return;
  }

  const updatedFundraiser = await publishFundraiser(req.params.id);
  if (!updatedFundraiser) {
    res.status(500).json({ message: "Failed to publish fundraiser" });
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
    message: "Successfully published fundraiser",
    data: cleanedFundraiser,
  });
};

export const createPickupEventHandler = async (
  req: Request<
    FundraiserRouteParams,
    any,
    z.infer<typeof CreatePickupEventBody>,
    {}
  >,
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

  const pickupEvent = await createPickupEvent({
    fundraiserId: req.params.id,
    ...req.body,
  });

  if (!pickupEvent) {
    res.status(500).json({ message: "Failed to create pickup event" });
    return;
  }

  res.status(200).json({
    message: "Successfully created pickup event",
    data: pickupEvent,
  });
};

export const updatePickupEventHandler = async (
  req: Request<
    PickupEventRouteParams,
    any,
    z.infer<typeof UpdatePickupEventBody>,
    {}
  >,
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
    res.status(403).json({ message: "Unauthorized to update fundraiser" });
    return;
  }

  const pickupEvent = await updatePickupEvent({
    pickupEventId: req.params.pickupEventId,
    ...req.body,
  });

  if (!pickupEvent) {
    res.status(500).json({ message: "Failed to update pickup event" });
    return;
  }

  res.status(200).json({
    message: "Successfully updated pickup event",
    data: pickupEvent,
  });
};

export const deletePickupEventHandler = async (
  req: Request<PickupEventRouteParams, any, {}, {}>,
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
    res.status(403).json({ message: "Unauthorized to update fundraiser" });
    return;
  }

  // check if fundraiser has only one pickup event
  if (fundraiser.pickupEvents.length <= 1) {
    res
      .status(400)
      .json({ message: "Fundraiser must have at least one pickup event" });
    return;
  }

  const pickupEvent = await deletePickupEvent(req.params.pickupEventId);

  if (!pickupEvent) {
    res.status(500).json({ message: "Failed to delete pickup event" });
    return;
  }

  res.status(200).json({
    message: "Successfully deleted pickup event",
    data: pickupEvent,
  });
};

export const createFundraiserItemHandler = async (
  req: Request<
    FundraiserRouteParams,
    any,
    z.infer<typeof CreateFundraiserItemBody>,
    {}
  >,
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
  req: Request<
    FundraiserItemRouteParams,
    any,
    z.infer<typeof UpdateFundraiserItemBody>,
    {}
  >,
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

  // If fundraiser is published, check if price is being changed
  if (fundraiser.published) {
    // Get the existing item to compare prices
    const existingItem = await getFundraiserItem(req.params.itemId);

    if (!existingItem) {
      res.status(404).json({ message: "Item not found" });
      return;
    }

    if (!existingItem.price.equals(req.body.price)) {
      res.status(400).json({
        message: "Cannot change price of an item in a published fundraiser",
      });
      return;
    }
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

export const deleteFundraiserItemHandler = async (
  req: Request<FundraiserItemRouteParams, any, {}, {}>,
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
    res.status(403).json({ message: "Unauthorized to delete fundraiser item" });
    return;
  }

  if (fundraiser.published) {
    res
      .status(400)
      .json({ message: "Cannot delete item from published fundraiser" });
    return;
  }

  const item = await deleteFundraiserItem(req.params.itemId);
  if (!item) {
    res.status(500).json({ message: "Failed to delete fundraiser item" });
    return;
  }

  res.status(200).json({
    message: "Successfully deleted fundraiser item",
  });
};

export const createAnnouncementHandler = async (
  req: Request<
    FundraiserRouteParams,
    any,
    z.infer<typeof CreateAnnouncementBody>,
    {}
  >,
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

  // send announcement email to buyers
  try {
    const orders = await getFundraiserOrders(req.params.id);

    if (orders && orders.length > 0) {
      const buyers = orders.map((order) => order.buyer);

      await sendAnnouncementEmail({
        fundraiser,
        announcement,
        recipients: buyers,
      });

      console.log(`Announcement email sent to ${buyers.length} buyers`);
    }
  } catch (error) {
    console.error("Failed to send announcement emails:", error);
  }

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

export const getFundraiserAnalyticsHandler = async (
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
    res
      .status(403)
      .json({ message: "Unauthorized to view fundraiser analytics" });
    return;
  }

  try {
    const analytics = await getFundraiserAnalytics(req.params.id);
    if (!analytics) {
      res.status(500).json({ message: "Failed to retrieve analytics" });
      return;
    }

    res.status(200).json({
      message: "Analytics retrieved",
      data: analytics,
    });
  } catch (error) {
    console.error("Analytics handler error:", error);
    res.status(500).json({ message: "Failed to retrieve analytics" });
  }
};

export const createReferralHandler = async (
  req: Request<z.infer<typeof FundraiserRouteParams>, any, {}, {}>,
  res: Response
) => {
  // Check if fundraiser exists
  const fundraiser = await getFundraiser(req.params.id);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }

  // Check if fundraiser is published
  if (!fundraiser.published) {
    res.status(400).json({ message: "Fundraiser is not published" });
    return;
  }

  // Create referral
  const referral = await createReferral({
    fundraiserId: req.params.id,
    referrerId: res.locals.user!.id,
  });

  if (!referral) {
    res.status(400).json({ message: "Referral request already exists" });
    return;
  }

  // Parse and return
  const parsedReferral = ReferralSchema.safeParse(referral);
  if (!parsedReferral.success) {
    res.status(500).json({ message: "Couldn't parse referral" });
    return;
  }

  res
    .status(201)
    .json({ message: "Referral request created", data: parsedReferral.data });
};

export const approveReferralHandler = async (
  req: Request<z.infer<typeof ApproveReferralRouteParams>, any, {}, {}>,
  res: Response
) => {
  // Get referral
  const referral = await getReferral(req.params.referralId);
  if (!referral) {
    res.status(404).json({ message: "Referral not found" });
    return;
  }

  // Validate that referral's fundraiserId matches URL param
  if (referral.fundraiserId !== req.params.fundraiserId) {
    res
      .status(400)
      .json({ message: "Referral does not belong to this fundraiser" });
    return;
  }

  // Check if user is admin of fundraiser's organization
  if (
    !referral.fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to approve referral" });
    return;
  }

  // Check if already approved
  if (referral.approved) {
    res.status(400).json({ message: "Referral is already approved" });
    return;
  }

  // Approve referral
  const approvedReferral = await approveReferral(req.params.referralId);
  if (!approvedReferral) {
    res.status(500).json({ message: "Failed to approve referral" });
    return;
  }

  // Parse and return
  const parsedReferral = ReferralSchema.safeParse(approvedReferral);
  if (!parsedReferral.success) {
    res.status(500).json({ message: "Couldn't parse referral" });
    return;
  }

  res
    .status(200)
    .json({ message: "Referral approved", data: parsedReferral.data });
};
