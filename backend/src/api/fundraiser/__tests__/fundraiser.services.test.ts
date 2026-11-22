import { Decimal } from "decimal.js";
import { prismaMock } from "../../../__tests__";
import memclient from "../../../utils/memjs";
import {
  calculateAndCacheFundraiserAnalytics,
  computeProfit,
  createFundraiserItem,
  hasCompleteCostData,
  updateCacheForOrderConfirmation,
  updateCacheForOrderPickup,
  updateFundraiser,
  updateFundraiserItem,
} from "../fundraiser.services";

jest.mock("../../../utils/memjs", () => ({
  __esModule: true,
  default: { get: jest.fn(), set: jest.fn(), delete: jest.fn() },
}));

const mockMem = memclient as unknown as {
  get: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
};

const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const cookieId = "523e4567-e89b-12d3-a456-426614174000";
const shirtId = "523e4567-e89b-12d3-a456-426614174001";

const item = (id: string, name: string, price: number, unitCost: number | null) => ({
  id,
  name,
  price: new Decimal(price),
  unitCost: unitCost === null ? null : new Decimal(unitCost),
});

const order = (
  overrides: { pickedUp?: boolean; paymentStatus?: string },
  items: Array<{ quantity: number; item: ReturnType<typeof item> }>
) => ({
  pickedUp: false,
  paymentStatus: "PENDING",
  createdAt: new Date("2026-11-01T12:00:00.000Z"),
  items,
  ...overrides,
});

const setup = ({
  expenses,
  items,
  orders,
}: {
  expenses: number | null;
  items: ReturnType<typeof item>[];
  orders: ReturnType<typeof order>[];
}) => {
  prismaMock.order.findMany.mockResolvedValue(orders as any);
  prismaMock.fundraiser.findUnique.mockResolvedValue({
    id: fundraiserId,
    goalAmount: new Decimal(500),
    expenses: expenses === null ? null : new Decimal(expenses),
    buyingStartsAt: new Date("2026-11-01"),
    buyingEndsAt: new Date("2026-11-30"),
  } as any);
  prismaMock.item.findMany.mockResolvedValue(items as any);
};

describe("Fundraiser cost & profit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMem.set.mockResolvedValue(true);
  });

  describe("hasCompleteCostData", () => {
    it("is true when fundraiser expenses are set, even if items lack unit costs", () => {
      expect(hasCompleteCostData(0, [{ unitCost: null }])).toBe(true);
    });

    it("is true when every item has a unit cost", () => {
      expect(
        hasCompleteCostData(null, [{ unitCost: new Decimal(1) }, { unitCost: new Decimal(0) }])
      ).toBe(true);
    });

    it("is false when no expenses and any item lacks a unit cost", () => {
      expect(
        hasCompleteCostData(null, [{ unitCost: new Decimal(1) }, { unitCost: null }])
      ).toBe(false);
    });

    it("is false when there are no items and no expenses", () => {
      expect(hasCompleteCostData(null, [])).toBe(false);
    });
  });

  describe("computeProfit", () => {
    it("subtracts item costs and expenses from revenue", () => {
      expect(
        computeProfit({ revenue: 100, itemCost: 30.5, expenses: 20, hasCostData: true })
      ).toBe(49.5);
    });

    it("returns null instead of an estimate without cost data", () => {
      expect(
        computeProfit({ revenue: 100, itemCost: 0, expenses: null, hasCostData: false })
      ).toBeNull();
    });

    it("can be negative when costs exceed revenue", () => {
      expect(
        computeProfit({ revenue: 10, itemCost: 0, expenses: 25, hasCostData: true })
      ).toBe(-15);
    });

    it("rounds to cents", () => {
      expect(
        computeProfit({ revenue: 0.3, itemCost: 0.1, expenses: 0.1, hasCostData: true })
      ).toBe(0.1);
    });
  });

  describe("calculateAndCacheFundraiserAnalytics", () => {
    it("computes profit from unit costs and expenses over confirmed/picked-up orders only", async () => {
      const cookie = item(cookieId, "Cookie", 3, 1);
      const shirt = item(shirtId, "Shirt", 20, 8);
      setup({
        expenses: 10,
        items: [cookie, shirt],
        orders: [
          order({ paymentStatus: "CONFIRMED" }, [{ quantity: 4, item: cookie }]), // 12 rev, 4 cost
          order({ pickedUp: true }, [{ quantity: 1, item: shirt }]), // 20 rev, 8 cost
          order({}, [{ quantity: 10, item: shirt }]), // pending: not counted
        ],
      });

      const analytics = await calculateAndCacheFundraiserAnalytics(fundraiserId);

      expect(analytics.total_revenue).toBe(32);
      expect(analytics.item_cost).toBe(12);
      expect(analytics.expenses).toBe(10);
      expect(analytics.has_cost_data).toBe(true);
      expect(analytics.profit).toBe(10); // 32 - 12 - 10
      expect(analytics.pending_orders).toBe(1);
    });

    it("returns null profit (no 20% estimate) when the seller hasn't entered costs", async () => {
      const cookie = item(cookieId, "Cookie", 3, null);
      setup({
        expenses: null,
        items: [cookie],
        orders: [order({ paymentStatus: "CONFIRMED" }, [{ quantity: 10, item: cookie }])],
      });

      const analytics = await calculateAndCacheFundraiserAnalytics(fundraiserId);

      expect(analytics.total_revenue).toBe(30);
      expect(analytics.has_cost_data).toBe(false);
      expect(analytics.profit).toBeNull();
    });

    it("returns null profit when only some items have unit costs and no expenses", async () => {
      const cookie = item(cookieId, "Cookie", 3, 1);
      const shirt = item(shirtId, "Shirt", 20, null);
      setup({
        expenses: null,
        items: [cookie, shirt],
        orders: [order({ paymentStatus: "CONFIRMED" }, [{ quantity: 2, item: cookie }])],
      });

      const analytics = await calculateAndCacheFundraiserAnalytics(fundraiserId);

      expect(analytics.profit).toBeNull();
    });

    it("treats items without unit costs as covered by expenses", async () => {
      const cookie = item(cookieId, "Cookie", 3, null);
      setup({
        expenses: 5,
        items: [cookie],
        orders: [order({ paymentStatus: "CONFIRMED" }, [{ quantity: 10, item: cookie }])],
      });

      const analytics = await calculateAndCacheFundraiserAnalytics(fundraiserId);

      expect(analytics.profit).toBe(25);
    });

    it("uses current unit costs, so past orders reflect edited costs", async () => {
      const cookie = item(cookieId, "Cookie", 3, 1);
      const pastOrder = order({ paymentStatus: "CONFIRMED" }, [{ quantity: 10, item: cookie }]);
      setup({ expenses: null, items: [cookie], orders: [pastOrder] });
      expect((await calculateAndCacheFundraiserAnalytics(fundraiserId)).profit).toBe(20);

      const edited = item(cookieId, "Cookie", 3, 2);
      setup({
        expenses: null,
        items: [edited],
        orders: [{ ...pastOrder, items: [{ quantity: 10, item: edited }] }],
      });
      expect((await calculateAndCacheFundraiserAnalytics(fundraiserId)).profit).toBe(10);
    });

    it("caches under a versioned key", async () => {
      setup({ expenses: null, items: [], orders: [] });
      await calculateAndCacheFundraiserAnalytics(fundraiserId);
      expect(mockMem.set).toHaveBeenCalledWith(
        `fundraiser_analytics_v2_${fundraiserId}`,
        expect.any(String),
        { expires: 300 }
      );
    });
  });

  describe("incremental cache updates", () => {
    const cached = (overrides: Record<string, unknown> = {}) => ({
      total_revenue: 30,
      total_orders: 2,
      orders_picked_up: 0,
      items: {},
      pending_orders: 1,
      profit: 10,
      has_cost_data: true,
      item_cost: 10,
      expenses: 10,
      goal_amount: 500,
      sale_data: {},
      revenue_data: {},
      start_date: new Date(),
      end_date: new Date(),
      ...overrides,
    });

    const savedAnalytics = () => JSON.parse(mockMem.set.mock.calls[0][1]);

    it("adds the order's item cost to profit on payment confirmation", async () => {
      mockMem.get.mockResolvedValue({ value: Buffer.from(JSON.stringify(cached())) });

      await updateCacheForOrderConfirmation(fundraiserId, {
        pickedUp: false,
        createdAt: new Date("2026-11-02T00:00:00.000Z"),
        items: [{ quantity: 2, item: { name: "Shirt", price: new Decimal(20), unitCost: new Decimal(8) } }],
      });

      const saved = savedAnalytics();
      expect(saved.total_revenue).toBe(70);
      expect(saved.item_cost).toBe(26);
      expect(saved.profit).toBe(34); // 70 - 26 - 10
    });

    it("adds the order's item cost to profit on pickup of an unconfirmed order", async () => {
      mockMem.get.mockResolvedValue({ value: Buffer.from(JSON.stringify(cached())) });

      await updateCacheForOrderPickup(
        fundraiserId,
        {
          createdAt: new Date("2026-11-02T00:00:00.000Z"),
          items: [{ quantity: 1, item: { name: "Cookie", price: new Decimal(3), unitCost: new Decimal(1) } }],
        },
        "PENDING"
      );

      const saved = savedAnalytics();
      expect(saved.total_revenue).toBe(33);
      expect(saved.profit).toBe(12); // 33 - 11 - 10
    });

    it("keeps profit null when cost data is missing", async () => {
      mockMem.get.mockResolvedValue({
        value: Buffer.from(
          JSON.stringify(cached({ has_cost_data: false, profit: null, expenses: null, item_cost: 0 }))
        ),
      });

      await updateCacheForOrderConfirmation(fundraiserId, {
        pickedUp: false,
        createdAt: new Date("2026-11-02T00:00:00.000Z"),
        items: [{ quantity: 1, item: { name: "Cookie", price: new Decimal(3), unitCost: null } }],
      });

      expect(savedAnalytics().profit).toBeNull();
    });
  });

  describe("persisting costs", () => {
    it("stores a unit cost when creating an item, defaulting to null", async () => {
      prismaMock.item.create.mockResolvedValue({} as any);
      const base = {
        fundraiserId,
        name: "Cookie",
        description: "",
        price: new Decimal(3),
        offsale: false,
        category: "DESSERTS" as const,
      };

      await createFundraiserItem({ ...base, unitCost: new Decimal(1.25) });
      expect(prismaMock.item.create.mock.calls[0][0].data.unitCost).toEqual(new Decimal(1.25));

      await createFundraiserItem(base);
      expect(prismaMock.item.create.mock.calls[1][0].data.unitCost).toBeNull();
    });

    it("leaves unit cost unchanged when omitted and clears it when null", async () => {
      prismaMock.item.update.mockResolvedValue({} as any);
      const base = {
        itemId: cookieId,
        name: "Cookie",
        description: "",
        price: new Decimal(3),
        offsale: false,
        category: "DESSERTS" as const,
      };

      await updateFundraiserItem(base);
      expect(prismaMock.item.update.mock.calls[0][0].data.unitCost).toBeUndefined();

      await updateFundraiserItem({ ...base, unitCost: null });
      expect(prismaMock.item.update.mock.calls[1][0].data.unitCost).toBeNull();
    });

    it("leaves expenses unchanged when omitted and clears them when null", async () => {
      prismaMock.fundraiser.update.mockResolvedValue({} as any);
      const base = {
        fundraiserId,
        name: "Bake Sale",
        description: "",
        imageUrls: [],
        buyingStartsAt: new Date(),
        buyingEndsAt: new Date(),
      };

      await updateFundraiser(base);
      expect(prismaMock.fundraiser.update.mock.calls[0][0].data.expenses).toBeUndefined();

      await updateFundraiser({ ...base, expenses: null });
      expect(prismaMock.fundraiser.update.mock.calls[1][0].data.expenses).toBeNull();

      await updateFundraiser({ ...base, expenses: new Decimal(40) });
      expect(prismaMock.fundraiser.update.mock.calls[2][0].data.expenses).toEqual(new Decimal(40));
    });
  });
});
