import { Decimal } from "decimal.js";
import { getReferralQuantities } from "common";

describe("getReferralQuantities", () => {
  it("should count and total only paid or picked up orders, and report every linked order", () => {
    const quantities = getReferralQuantities([
      {
        paymentStatus: "CONFIRMED",
        pickedUp: false,
        items: [{ quantity: 2, item: { price: new Decimal("3.50") } }],
      },
      {
        paymentStatus: "UNVERIFIABLE",
        pickedUp: true,
        items: [
          { quantity: 1, item: { price: new Decimal("10.00") } },
          { quantity: 3, item: { price: new Decimal("2.00") } },
        ],
      },
      {
        paymentStatus: "PENDING",
        pickedUp: false,
        items: [{ quantity: 1, item: { price: new Decimal("10.00") } }],
      },
    ]);

    expect(quantities).toEqual({
      orderCount: 2,
      amountRaised: 23,
      attributedOrderCount: 3,
    });
  });

  it("should report zero for a referrer with no orders", () => {
    expect(getReferralQuantities([])).toEqual({
      orderCount: 0,
      amountRaised: 0,
      attributedOrderCount: 0,
    });
  });
});
