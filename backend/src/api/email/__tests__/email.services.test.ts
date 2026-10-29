import { Decimal } from "decimal.js";
import { createMockUser } from "../../../__tests__";

// email.services.ts pulls in cheerio (for the Venmo email parsers), which
// drags in undici and needs web globals (File, etc.) that aren't present
// under Jest's node environment. Stub it out — none of these tests touch
// the parsing functions.
jest.mock("cheerio", () => ({ load: jest.fn() }));
jest.mock("../../order/order.services");
jest.mock("../../../utils/email");

import { updateOrderPaymentStatus } from "../email.services";
import * as orderServices from "../../order/order.services";
import * as emailUtils from "../../../utils/email";

describe("Email Services", () => {
  const orderId = "323e4567-e89b-12d3-a456-426614174000";

  beforeEach(() => {
    jest.clearAllMocks();
    (orderServices.calculateOrderTotal as jest.Mock).mockResolvedValue(
      new Decimal("10.00")
    );
  });

  describe("updateOrderPaymentStatus", () => {
    it.each([
      ["exactly matches", "10.00"],
      ["is within the 1-cent tolerance", "10.01"],
    ])("should confirm the order when the amount %s", async (_case, paid) => {
      const confirmedOrder = { id: orderId, paymentStatus: "CONFIRMED" };
      (orderServices.confirmOrderPayment as jest.Mock).mockResolvedValue(
        confirmedOrder
      );

      const result = await updateOrderPaymentStatus(orderId, new Decimal(paid));

      expect(orderServices.confirmOrderPayment).toHaveBeenCalledWith(
        orderId,
        "VENMO"
      );
      expect(orderServices.recordOrderPaymentMismatch).not.toHaveBeenCalled();
      expect(emailUtils.sendPaymentMismatchEmail).not.toHaveBeenCalled();
      expect(result).toEqual(confirmedOrder);
    });

    it("should record a mismatch and email the buyer when the amount doesn't match", async () => {
      const mockBuyer = createMockUser();
      const mismatchedOrder = {
        id: orderId,
        buyer: mockBuyer,
        fundraiser: { name: "Test Fundraiser" },
      };
      (orderServices.recordOrderPaymentMismatch as jest.Mock).mockResolvedValue(
        mismatchedOrder
      );

      const result = await updateOrderPaymentStatus(
        orderId,
        new Decimal("15.00")
      );

      expect(orderServices.recordOrderPaymentMismatch).toHaveBeenCalledWith(
        orderId,
        new Decimal("15.00")
      );
      expect(emailUtils.sendPaymentMismatchEmail).toHaveBeenCalledWith({
        buyer: mockBuyer,
        fundraiserName: "Test Fundraiser",
        orderId,
        expectedAmount: new Decimal("10.00"),
        paidAmount: new Decimal("15.00"),
      });
      expect(orderServices.confirmOrderPayment).not.toHaveBeenCalled();
      expect(result).toEqual(mismatchedOrder);
    });

    it("should wrap errors from confirmOrderPayment with a descriptive message", async () => {
      (orderServices.confirmOrderPayment as jest.Mock).mockRejectedValue(
        new Error("Insufficient stock for Test Item")
      );

      await expect(
        updateOrderPaymentStatus(orderId, new Decimal("10.00"))
      ).rejects.toThrow(
        "Failed to update order payment status: Insufficient stock for Test Item"
      );
    });
  });
});
