import { prisma } from "../../utils/prisma";
import { calculateOrderTotal } from "../order/order.services";

export const updateOrderPaymentStatus = async (
  orderId: string,
  paidAmount: number
) => {
  try {
    // Calculate expected order total
    const expectedAmount = await calculateOrderTotal(orderId);

    // Validate that paid amount matches expected amount (with small tolerance for floating point precision)
    const tolerance = 0.01;
    if (Math.abs(paidAmount - expectedAmount) > tolerance) {
      throw new Error(
        `Payment amount mismatch: expected $${expectedAmount.toFixed(
          2
        )}, received $${paidAmount.toFixed(2)}`
      );
    }

    // Update order with Venmo payment confirmation
    const order = await prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        paymentMethod: "VENMO",
        paymentStatus: "CONFIRMED",
      },
    });

    return order;
  } catch (error) {
    throw new Error(
      `Failed to update order payment status: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
