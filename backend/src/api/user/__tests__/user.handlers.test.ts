import { Response } from "express-serve-static-core";
import {
  mockResponse,
  createMockUser,
  createMockOrganization,
  createMockSupabaseUser,
} from "../../../__tests__";
import {
  getUserHandler,
  getUserOrdersHandler,
  getUserOrganizationsHandler,
  updateUserHandler,
  findUserByEmailHandler,
} from "../user.handlers";
import * as userServices from "../user.services";

// Mock the user services module
jest.mock("../user.services");

describe("User Handlers", () => {
  let mockRes: ReturnType<typeof mockResponse>;

  beforeEach(() => {
    mockRes = mockResponse();
    // Clear all mocks from previous tests
    jest.clearAllMocks();
  });

  describe("getUserHandler", () => {
    it("should return 200 and user data when user exists", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };

      (userServices.getUser as jest.Mock).mockResolvedValue(mockUser);

      await getUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User retrieved",
        data: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
        }),
      });
    });

    it("should return 404 when user not found", async () => {
      const mockReq: any = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      };

      (userServices.getUser as jest.Mock).mockResolvedValue(null);

      await getUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 when user data fails validation", async () => {
      const mockReq: any = {
        params: { id: "123e4567-e89b-12d3-a456-426614174000" },
      };

      // Return invalid user data (missing required fields)
      (userServices.getUser as jest.Mock).mockResolvedValue({
        id: "123e4567-e89b-12d3-a456-426614174000",
        email: "invalid-email", // Invalid email format
      });

      await getUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Couldn't parse user",
      });
    });
  });

  describe("getUserOrdersHandler", () => {
    it("should return 200 and orders when authorized user requests their orders", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

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

      (userServices.getUserOrders as jest.Mock).mockResolvedValue(mockOrders);

      await getUserOrdersHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Orders retrieved",
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockOrders[0].id,
          }),
        ]),
      });
    });

    it("should return 403 when user tries to access another user's orders", async () => {
      const mockReq: any = {
        params: { id: "223e4567-e89b-12d3-a456-426614174999" },
      };
      mockRes.locals.user = createMockSupabaseUser(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      await getUserOrdersHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized to view user orders",
      });
      expect(userServices.getUserOrders).not.toHaveBeenCalled();
    });

    it("should return 404 when orders not found", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      (userServices.getUserOrders as jest.Mock).mockResolvedValue(null);

      await getUserOrdersHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Orders not found",
      });
    });

    it("should return 500 when orders fail parsing", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      // Return invalid order data
      (userServices.getUserOrders as jest.Mock).mockResolvedValue([
        { id: "invalid-data" }, // Missing required fields
      ]);

      await getUserOrdersHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Failed to parse orders",
      });
    });
  });

  describe("getUserOrganizationsHandler", () => {
    it("should return 200 and organizations when authorized user requests their organizations", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      const mockOrganizations = [createMockOrganization()];
      (userServices.getUserOrganizations as jest.Mock).mockResolvedValue(
        mockOrganizations
      );

      await getUserOrganizationsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Organizations retrieved",
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockOrganizations[0].id,
          }),
        ]),
      });
    });

    it("should return 403 when user tries to access another user's organizations", async () => {
      const mockReq: any = {
        params: { id: "223e4567-e89b-12d3-a456-426614174999" },
      };
      mockRes.locals.user = createMockSupabaseUser(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      await getUserOrganizationsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized to view user organizations",
      });
      expect(userServices.getUserOrganizations).not.toHaveBeenCalled();
    });

    it("should return 404 when organizations not found", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      (userServices.getUserOrganizations as jest.Mock).mockResolvedValue(null);

      await getUserOrganizationsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Organizations not found",
      });
    });

    it("should return 500 when organizations fail parsing", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      // Return invalid organization data
      (userServices.getUserOrganizations as jest.Mock).mockResolvedValue([
        { id: "invalid" }, // Missing required fields
      ]);

      await getUserOrganizationsHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Couldn't parse organizations",
      });
    });
  });

  describe("updateUserHandler", () => {
    it("should return 200 and updated user when authorized user updates their profile", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
        body: {
          name: "Updated Name",
          venmoUsername: "updated-venmo",
        },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      const updatedUser = {
        ...mockUser,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      };

      (userServices.updateUser as jest.Mock).mockResolvedValue(updatedUser);

      await updateUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User updated",
        data: expect.objectContaining({
          id: mockUser.id,
          name: "Updated Name",
          venmoUsername: "updated-venmo",
        }),
      });
      expect(userServices.updateUser).toHaveBeenCalledWith({
        userId: mockUser.id,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      });
    });

    it("should return 403 when user tries to update another user", async () => {
      const mockReq: any = {
        params: { id: "223e4567-e89b-12d3-a456-426614174999" },
        body: {
          name: "Updated Name",
        },
      };
      mockRes.locals.user = createMockSupabaseUser(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      await updateUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Unauthorized to update user",
      });
      expect(userServices.updateUser).not.toHaveBeenCalled();
    });

    it("should return 404 when user not found", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
        body: {
          name: "Updated Name",
        },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      (userServices.updateUser as jest.Mock).mockResolvedValue(null);

      await updateUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 when updated user fails parsing", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        params: { id: mockUser.id },
        body: {
          name: "Updated Name",
        },
      };
      mockRes.locals.user = createMockSupabaseUser(mockUser.id);

      // Return invalid user data
      (userServices.updateUser as jest.Mock).mockResolvedValue({
        id: mockUser.id,
        email: "invalid-email",
      });

      await updateUserHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Couldn't parse user",
      });
    });
  });

  describe("findUserByEmailHandler", () => {
    it("should return 200 and user when user found by email", async () => {
      const mockUser = createMockUser();
      const mockReq: any = {
        query: { email: mockUser.email },
      };

      (userServices.findUserByEmail as jest.Mock).mockResolvedValue(mockUser);

      await findUserByEmailHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User retrieved",
        data: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
      });
      expect(userServices.findUserByEmail).toHaveBeenCalledWith(mockUser.email);
    });

    it("should return 404 when user not found by email", async () => {
      const mockReq: any = {
        query: { email: "nonexistent@example.com" },
      };

      (userServices.findUserByEmail as jest.Mock).mockResolvedValue(null);

      await findUserByEmailHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found",
      });
    });

    it("should return 500 when user data fails validation", async () => {
      const mockReq: any = {
        query: { email: "test@example.com" },
      };

      // Return invalid user data
      (userServices.findUserByEmail as jest.Mock).mockResolvedValue({
        id: "123",
        email: "invalid",
      });

      await findUserByEmailHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Couldn't parse user",
      });
    });
  });
});
