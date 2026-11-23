import request from "supertest";
import express, { Express } from "express";
import { Decimal } from "decimal.js";
import type { ReferralOrder } from "common";
import fundraiserRouter from "../fundraiser.router";
import {
  prismaMock,
  mockSupabaseAuth,
  createMockSupabaseUser,
} from "../../../__tests__";

const FUNDRAISER_ID = "423e4567-e89b-12d3-a456-426614174000";
const REFERRER_ID = "123e4567-e89b-12d3-a456-426614174000";

const createOrder = (
  state: Pick<ReferralOrder, "paymentStatus" | "pickedUp">
): ReferralOrder => ({
  ...state,
  items: [{ quantity: 2, item: { price: new Decimal("3.50") } }],
});

const createReferralRow = (referral: {
  approved: boolean;
  orders: ReferralOrder[];
}) => ({
  id: "523e4567-e89b-12d3-a456-426614174000",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  fundraiserId: FUNDRAISER_ID,
  referrerId: REFERRER_ID,
  ...referral,
});

describe("Fundraiser Router", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/fundraiser", fundraiserRouter);
  });

  describe("GET /api/fundraiser/:id/referrals/me", () => {
    const logInAsReferrer = () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(REFERRER_ID) },
      });
    };

    const getOwnReferralCount = () =>
      request(app)
        .get(`/api/fundraiser/${FUNDRAISER_ID}/referrals/me`)
        .set("Authorization", "Bearer valid-token");

    it("should return 401 when the user is not logged in", async () => {
      const response = await request(app)
        .get(`/api/fundraiser/${FUNDRAISER_ID}/referrals/me`)
        .expect(401);

      expect(response.body.data).toBeUndefined();
    });

    it("should return 404 when the user is not a referrer for the fundraiser", async () => {
      logInAsReferrer();
      prismaMock.referral.findUnique.mockResolvedValue(null);

      const response = await getOwnReferralCount().expect(404);

      expect(response.body.message).toBe("Referral not found");
      expect(response.body.data).toBeUndefined();
    });

    it("should return 403 without a count when the referral is still pending", async () => {
      logInAsReferrer();
      prismaMock.referral.findUnique.mockResolvedValue(
        createReferralRow({
          approved: false,
          orders: [
            createOrder({ paymentStatus: "CONFIRMED", pickedUp: true }),
          ],
        })
      );

      const response = await getOwnReferralCount().expect(403);

      expect(response.body.message).toBe("Referral is not approved");
      expect(response.body.data).toBeUndefined();
    });

    it("should return only the number of paid or picked up orders for an approved referrer", async () => {
      logInAsReferrer();
      prismaMock.referral.findUnique.mockResolvedValue(
        createReferralRow({
          approved: true,
          orders: [
            createOrder({ paymentStatus: "CONFIRMED", pickedUp: false }),
            createOrder({ paymentStatus: "CONFIRMED", pickedUp: true }),
            createOrder({ paymentStatus: "UNVERIFIABLE", pickedUp: true }),
            createOrder({ paymentStatus: "PENDING", pickedUp: true }),
            createOrder({ paymentStatus: "PENDING", pickedUp: false }),
            createOrder({ paymentStatus: "UNVERIFIABLE", pickedUp: false }),
          ],
        })
      );

      const response = await getOwnReferralCount().expect(200);

      expect(response.body.data).toEqual({ orderCount: 4 });
    });

    it("should return a count of zero for an approved referrer with no orders", async () => {
      logInAsReferrer();
      prismaMock.referral.findUnique.mockResolvedValue(
        createReferralRow({ approved: true, orders: [] })
      );

      const response = await getOwnReferralCount().expect(200);

      expect(response.body.data).toEqual({ orderCount: 0 });
    });

    it("should look up the referral of the logged-in user for the fundraiser in the URL", async () => {
      logInAsReferrer();
      prismaMock.referral.findUnique.mockResolvedValue(
        createReferralRow({ approved: true, orders: [] })
      );

      await getOwnReferralCount().expect(200);

      expect(prismaMock.referral.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            fundraiserId_referrerId: {
              fundraiserId: FUNDRAISER_ID,
              referrerId: REFERRER_ID,
            },
          },
        })
      );
    });
  });
});
