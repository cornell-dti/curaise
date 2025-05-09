import { Request, Response } from "express-serve-static-core";
import { OrderRouteParams } from "./order.types";
import {
  completeOrderPickup,
  confirmOrderPayment,
  createOrder,
  getOrder,
} from "./order.services";
import { BasicOrderSchema, CompleteOrderSchema, CreateOrderBody } from "common";
import { getFundraiser } from "../fundraiser/fundraiser.services";
import { z } from "zod";
import { sendOrderConfirmation } from "../../utils/email";

export const getOrderHandler = async (
  req: Request<OrderRouteParams, any, {}, {}>,
  res: Response
) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (
    // Check if user is buyer of order
    order.buyerId !== res.locals.user!.id &&
    // Check if user is admin of fundraiser's organization
    !order.fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to view order" });
    return;
  }

  // remove irrelevant fields from returned order
  const parsedOrder = CompleteOrderSchema.safeParse(order);
  if (!parsedOrder.success) {
    res.status(500).json({ message: "Couldn't parse order" });
    return;
  }
  const cleanedOrder = parsedOrder.data;

  res.status(200).json({ message: "Order retrieved", data: cleanedOrder });
};

export const createOrderHandler = async (
  req: Request<{}, any, z.infer<typeof CreateOrderBody>, {}>,
  res: Response
) => {
  const fundraiser = await getFundraiser(req.body.fundraiserId);
  if (!fundraiser) {
    res.status(404).json({ message: "Fundraiser not found" });
    return;
  }
  if (fundraiser.buyingStartsAt > new Date()) {
    res
      .status(400)
      .json({ message: "Fundraiser buying period has not started" });
    return;
  }
  if (fundraiser.buyingEndsAt < new Date()) {
    res.status(400).json({ message: "Fundraiser buying period has ended" });
    return;
  }

  const order = await createOrder({
    ...req.body,
    buyerId: res.locals.user!.id,
  });
  if (!order) {
    res.status(500).json({ message: "Failed to create order" });
    return;
  }

  // remove irrelevant fields from returned order
  const parsedOrder = BasicOrderSchema.safeParse(order);
  if (!parsedOrder.success) {
    res.status(500).json({ message: "Couldn't parse order" });
    return;
  }
  const cleanedOrder = parsedOrder.data;

  // TODO: ADD LOGIC TO SEND EMAIL WITH QR CODE
  // For now, just send email to buyer with order details without QR code
  try {
    await sendOrderConfirmation(cleanedOrder);
    console.log("Order confirmation email sent");
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }

  res.status(201).json({ message: "Order created", data: cleanedOrder });
};

export const completeOrderPickupHandler = async (
  req: Request<OrderRouteParams, any, {}, {}>,
  res: Response
) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (
    // Check if user is admin of fundraiser's organization
    !order.fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to complete order pickup" });
    return;
  }

  const completedOrder = await completeOrderPickup(req.params.id);
  if (!completedOrder) {
    res.status(500).json({ message: "Failed to complete order pickup" });
    return;
  }

  // remove irrelevant fields from returned order
  const parsedOrder = BasicOrderSchema.safeParse(completedOrder);
  if (!parsedOrder.success) {
    res.status(500).json({ message: "Couldn't parse order" });
    return;
  }
  const cleanedOrder = parsedOrder.data;

  res
    .status(200)
    .json({ message: "Order pickup completed", data: cleanedOrder });
};

export const confirmOrderPaymentHandler = async (
  req: Request<OrderRouteParams, any, {}, {}>,
  res: Response
) => {
  const order = await getOrder(req.params.id);
  if (!order) {
    res.status(404).json({ message: "Order not found" });
    return;
  }

  if (
    // Check if user is admin of fundraiser's organization
    !order.fundraiser.organization.admins.some(
      (admin) => admin.id === res.locals.user!.id
    )
  ) {
    res.status(403).json({ message: "Unauthorized to confirm order payment" });
    return;
  }

  const confirmedOrder = await confirmOrderPayment(req.params.id);
  if (!confirmedOrder) {
    res.status(500).json({ message: "Failed to confirm order payment" });
    return;
  }

  // remove irrelevant fields from returned order
  const parsedOrder = BasicOrderSchema.safeParse(confirmedOrder);
  if (!parsedOrder.success) {
    res.status(500).json({ message: "Couldn't parse order" });
    return;
  }
  const cleanedOrder = parsedOrder.data;

  res
    .status(200)
    .json({ message: "Order payment confirmed", data: cleanedOrder });
};
