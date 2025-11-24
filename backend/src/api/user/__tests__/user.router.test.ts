import request from "supertest";
import express, { Express } from "express";
import userRouter from "../user.router";
import {
  prismaMock,
  mockSupabaseAuth,
  createMockUser,
  createMockOrganization,
  createMockSupabaseUser,
} from "../../../__tests__";

describe("User Router E2E Tests", () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/user", userRouter);
  });

  describe("GET /api/user/search", () => {
    it("should return 200 and user when valid email provided", async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/api/user/search")
        .query({ email: mockUser.email })
        .expect(200);

      expect(response.body.message).toBe("User retrieved");
      expect(response.body.data).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it("should return 400 when email is missing", async () => {
      const response = await request(app).get("/api/user/search").expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 400 when email format is invalid", async () => {
      const response = await request(app)
        .get("/api/user/search")
        .query({ email: "invalid-email" })
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 404 when user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/user/search")
        .query({ email: "nonexistent@example.com" })
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("GET /api/user/:id", () => {
    it("should return 200 and user when valid UUID provided", async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/user/${mockUser.id}`)
        .expect(200);

      expect(response.body.message).toBe("User retrieved");
      expect(response.body.data).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
      });
    });

    it("should return 400 when ID is not a valid UUID", async () => {
      const response = await request(app)
        .get("/api/user/invalid-id")
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 404 when user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .get("/api/user/123e4567-e89b-12d3-a456-426614174000")
        .expect(404);

      expect(response.body.message).toBe("User not found");
    });
  });

  describe("GET /api/user/:id/orders", () => {
    it("should return 401 when no authorization token provided", async () => {
      const response = await request(app)
        .get("/api/user/123e4567-e89b-12d3-a456-426614174000/orders")
        .expect(401);

      expect(response.body.message).toBe("Invalid authorization token");
    });

    it("should return 403 when user tries to access another user's orders", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const differentUserId = "223e4567-e89b-12d3-a456-426614174000";

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(userId) },
      });

      const response = await request(app)
        .get(`/api/user/${differentUserId}/orders`)
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body.message).toBe("Unauthorized to view user orders");
    });

    it("should return 200 and orders when authorized user requests their orders", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const mockOrders: any = [
        {
          id: "323e4567-e89b-12d3-a456-426614174000",
          paymentMethod: "VENMO",
          paymentStatus: "PENDING",
          pickedUp: false,
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
          buyer: mockUser,
          fundraiser: {
            id: "423e4567-e89b-12d3-a456-426614174000",
            name: "Test Fundraiser",
            description: "Test description",
            goalAmount: 1000,
            imageUrls: ["https://example.com/image.jpg"],
            pickupLocation: "Test Location",
            buyingStartsAt: new Date("2024-01-01"),
            buyingEndsAt: new Date("2024-12-31"),
            pickupStartsAt: new Date("2024-12-01"),
            pickupEndsAt: new Date("2024-12-31"),
            organization: createMockOrganization(),
          },
        },
      ];

      prismaMock.order.findMany.mockResolvedValue(mockOrders);

      const response = await request(app)
        .get(`/api/user/${mockUser.id}/orders`)
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body.message).toBe("Orders retrieved");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: mockOrders[0].id,
        paymentMethod: "VENMO",
      });
    });

    it("should return 400 when ID is not a valid UUID", async () => {
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser() },
      });

      const response = await request(app)
        .get("/api/user/invalid-id/orders")
        .set("Authorization", "Bearer valid-token")
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });
  });

  describe("GET /api/user/:id/organizations", () => {
    it("should return 401 when no authorization token provided", async () => {
      const response = await request(app)
        .get("/api/user/123e4567-e89b-12d3-a456-426614174000/organizations")
        .expect(401);

      expect(response.body.message).toBe("Invalid authorization token");
    });

    it("should return 403 when user tries to access another user's organizations", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const differentUserId = "223e4567-e89b-12d3-a456-426614174000";

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(userId) },
      });

      const response = await request(app)
        .get(`/api/user/${differentUserId}/organizations`)
        .set("Authorization", "Bearer valid-token")
        .expect(403);

      expect(response.body.message).toBe(
        "Unauthorized to view user organizations"
      );
    });

    it("should return 200 and organizations when authorized user requests their organizations", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const mockOrganizations = [createMockOrganization()];
      prismaMock.organization.findMany.mockResolvedValue(mockOrganizations);

      const response = await request(app)
        .get(`/api/user/${mockUser.id}/organizations`)
        .set("Authorization", "Bearer valid-token")
        .expect(200);

      expect(response.body.message).toBe("Organizations retrieved");
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        id: mockOrganizations[0].id,
        name: mockOrganizations[0].name,
      });
    });
  });

  describe("POST /api/user/:id", () => {
    it("should return 401 when no authorization token provided", async () => {
      const response = await request(app)
        .post("/api/user/123e4567-e89b-12d3-a456-426614174000")
        .send({ name: "Updated Name" })
        .expect(401);

      expect(response.body.message).toBe("Invalid authorization token");
    });

    it("should return 403 when user tries to update another user", async () => {
      const userId = "123e4567-e89b-12d3-a456-426614174000";
      const differentUserId = "223e4567-e89b-12d3-a456-426614174000";

      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(userId) },
      });

      const response = await request(app)
        .post(`/api/user/${differentUserId}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "Updated Name" })
        .expect(403);

      expect(response.body.message).toBe("Unauthorized to update user");
    });

    it("should return 200 and updated user when valid data provided", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const updatedUser = {
        ...mockUser,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Updated Name",
          venmoUsername: "updated-venmo",
        })
        .expect(200);

      expect(response.body.message).toBe("User updated");
      expect(response.body.data).toMatchObject({
        id: mockUser.id,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      });
    });

    it("should return 400 when name is missing", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({ venmoUsername: "updated-venmo" })
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 400 when name is empty", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({ name: "" })
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 400 when venmoUsername is too short", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Updated Name",
          venmoUsername: "abc", // Less than 5 characters
        })
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should return 400 when venmoUsername is too long", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Updated Name",
          venmoUsername: "a".repeat(31), // More than 30 characters
        })
        .expect(400);

      expect(response.body.message).toContain("Invalid schema");
    });

    it("should accept empty string for venmoUsername", async () => {
      const mockUser = createMockUser();
      mockSupabaseAuth.getUser.mockResolvedValue({
        data: { user: createMockSupabaseUser(mockUser.id) },
      });

      const updatedUser = {
        ...mockUser,
        name: "Updated Name",
        venmoUsername: null,
      };

      prismaMock.user.update.mockResolvedValue(updatedUser);

      const response = await request(app)
        .post(`/api/user/${mockUser.id}`)
        .set("Authorization", "Bearer valid-token")
        .send({
          name: "Updated Name",
          venmoUsername: "", // Empty string should be transformed to undefined
        })
        .expect(200);

      expect(response.body.message).toBe("User updated");
    });
  });
});
