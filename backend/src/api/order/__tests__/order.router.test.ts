import request from "supertest";
import express, { Express } from "express";
import orderRouter from "../order.router";
import {
  prismaMock,
  mockSupabaseAuth,
  createMockOrder,
  createMockOrganization,
  createMockSupabaseUser,
  createMockUser,
} from "../../../__tests__";

jest.mock("../../../utils/email", () => ({}));

const adminId = "123e4567-e89b-12d3-a456-426614174000";
const buyerId = "123e4567-e89b-12d3-a456-426614174001";
const strangerId = "123e4567-e89b-12d3-a456-426614174002";
const referrerId = "123e4567-e89b-12d3-a456-426614174003";
const orderId = "323e4567-e89b-12d3-a456-426614174000";
const fundraiserId = "423e4567-e89b-12d3-a456-426614174000";
const itemId = "523e4567-e89b-12d3-a456-426614174000";
const referralId = "623e4567-e89b-12d3-a456-426614174000";

const referrer = createMockUser({
  id: referrerId,
  name: "Maya Chen",
  email: "mc100@cornell.edu",
});
const admin = createMockUser({ id: adminId, name: "Org Admin" });

const approvedReferral = {
  id: referralId,
  approved: true,
  createdAt: new Date("2024-01-01"),
  fundraiserId,
  referrerId,
  referrer,
};

// Shape returned by getOrder / updateOrderReferral (orderWithReferralInclude)
const fullOrder = (overrides: Record<string, unknown> = {}) => ({
  ...createMockOrder({ id: orderId, buyerId, fundraiserId }),
  buyer: createMockUser({ id: buyerId, name: "Andre Silva" }),
  fundraiser: {
    id: fundraiserId,
    name: "Test Fundraiser",
    description: "A test fundraiser",
    published: true,
    goalAmount: null,
    imageUrls: [],
    buyingStartsAt: new Date("2024-01-01"),
    buyingEndsAt: new Date("2024-01-31"),
    organization: {
      ...createMockOrganization(),
      admins: [{ id: adminId }],
    },
    pickupEvents: [],
  },
  items: [
    {
      quantity: 2,
      item: {
        id: itemId,
        name: "Muffin",
        description: "A muffin",
        price: "3.50",
        imageUrl: null,
        offsale: false,
        category: "OTHER",
      },
    },
  ],
  referral: null,
  referralUpdatedBy: null,
  ...overrides,
});

const signInAs = (userId: string) =>
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user: createMockSupabaseUser(userId) },
  });

describe("Order Router E2E Tests", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/order", orderRouter);
    prismaMock.$transaction.mockImplementation(((callback: any) =>
      callback(prismaMock)) as any);
  });

  describe("POST /api/order/:id/referral", () => {
    const url = `/api/order/${orderId}/referral`;

    it("should let an admin attach a referrer to an order that had none", async () => {
      signInAs(adminId);
      prismaMock.order.findUnique
        // handler: getOrder for the auth check
        .mockResolvedValueOnce(fullOrder() as any)
        // service: current referral inside the transaction
        .mockResolvedValueOnce({
          id: orderId,
          fundraiserId,
          referralId: null,
        } as any);
      prismaMock.referral.findUnique.mockResolvedValue(approvedReferral as any);
      const updatedAt = new Date("2026-11-22T15:00:00.000Z");
      prismaMock.order.update.mockResolvedValue(
        fullOrder({
          referralId,
          referral: approvedReferral,
          referralUpdatedAt: updatedAt,
          referralUpdatedById: adminId,
          referralUpdatedBy: admin,
        }) as any
      );

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId })
        .expect(200);

      expect(response.body.message).toBe("Order referral updated");
      expect(response.body.data.referral).toMatchObject({
        id: referralId,
        referrer: { name: "Maya Chen" },
      });
      expect(response.body.data.referralUpdatedBy).toMatchObject({
        id: adminId,
      });
      expect(response.body.data.referralUpdatedAt).toBe(
        updatedAt.toISOString()
      );
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referral: { connect: { id: referralId } },
            referralUpdatedBy: { connect: { id: adminId } },
          }),
        })
      );
    });

    it("should let an admin clear the referrer", async () => {
      signInAs(adminId);
      prismaMock.order.findUnique
        .mockResolvedValueOnce(
          fullOrder({ referralId, referral: approvedReferral }) as any
        )
        .mockResolvedValueOnce({ id: orderId, fundraiserId, referralId } as any);
      prismaMock.order.update.mockResolvedValue(
        fullOrder({ referralUpdatedBy: admin }) as any
      );

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId: null })
        .expect(200);

      expect(response.body.data.referral).toBeNull();
      expect(prismaMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ referral: { disconnect: true } }),
        })
      );
    });

    it.each([
      ["the buyer of the order", buyerId],
      ["a user unrelated to the fundraiser", strangerId],
    ])("should return 403 for %s", async (_, userId) => {
      signInAs(userId);
      prismaMock.order.findUnique.mockResolvedValueOnce(fullOrder() as any);

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId })
        .expect(403);

      expect(response.body.message).toBe(
        "Unauthorized to update order referral"
      );
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });

    it("should return 401 without a valid token", async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({ data: { user: null } });

      await request(app).post(url).send({ referralId }).expect(401);

      expect(prismaMock.order.findUnique).not.toHaveBeenCalled();
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });

    it("should return 404 when the order does not exist", async () => {
      signInAs(adminId);
      prismaMock.order.findUnique.mockResolvedValueOnce(null);

      await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId })
        .expect(404);
    });

    it("should return 400 for a referrer from another fundraiser", async () => {
      signInAs(adminId);
      prismaMock.order.findUnique
        .mockResolvedValueOnce(fullOrder() as any)
        .mockResolvedValueOnce({
          id: orderId,
          fundraiserId,
          referralId: null,
        } as any);
      prismaMock.referral.findUnique.mockResolvedValue({
        fundraiserId: "999e4567-e89b-12d3-a456-426614174000",
        approved: true,
      } as any);

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId })
        .expect(400);

      expect(response.body.message).toBe(
        "Referrer is not part of this fundraiser"
      );
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });

    it("should return 400 for a referrer who is not approved yet", async () => {
      signInAs(adminId);
      prismaMock.order.findUnique
        .mockResolvedValueOnce(fullOrder() as any)
        .mockResolvedValueOnce({
          id: orderId,
          fundraiserId,
          referralId: null,
        } as any);
      prismaMock.referral.findUnique.mockResolvedValue({
        fundraiserId,
        approved: false,
      } as any);

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send({ referralId })
        .expect(400);

      expect(response.body.message).toBe("Referrer has not been approved");
    });

    it.each([
      ["a missing referralId", {}],
      ["a non-uuid referralId", { referralId: "not-a-uuid" }],
    ])("should return 400 for %s", async (_, body) => {
      signInAs(adminId);

      const response = await request(app)
        .post(url)
        .set("Authorization", "Bearer valid-token")
        .send(body)
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
      expect(prismaMock.order.update).not.toHaveBeenCalled();
    });
  });
});
