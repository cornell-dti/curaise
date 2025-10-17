import {
  prismaMock,
  createMockUser,
  createMockUsers,
  createMockOrganization,
  createMockOrder,
} from "../../../__tests__";
import {
  getUser,
  getUsersByIds,
  getUserOrders,
  getUserOrganizations,
  updateUser,
  findUserByEmail,
} from "../user.services";

describe("User Services", () => {
  describe("getUser", () => {
    it("should return user when found", async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUser(mockUser.id);

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
    });

    it("should return null when user not found", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await getUser("non-existent-id");

      expect(result).toBeNull();
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: "non-existent-id" },
      });
    });
  });

  describe("getUsersByIds", () => {
    it("should return users for valid IDs", async () => {
      const mockUsers = createMockUsers(3);
      const userIds = mockUsers.map((u) => u.id);
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      const result = await getUsersByIds(userIds);

      expect(result).toEqual(mockUsers);
      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: userIds,
          },
        },
      });
    });

    it("should deduplicate user IDs", async () => {
      const mockUsers = createMockUsers(2);
      const duplicateIds = [mockUsers[0].id, mockUsers[0].id, mockUsers[1].id];
      prismaMock.user.findMany.mockResolvedValue(mockUsers);

      await getUsersByIds(duplicateIds);

      expect(prismaMock.user.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [mockUsers[0].id, mockUsers[1].id],
          },
        },
      });
    });

    it("should return null on error", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation();
      prismaMock.user.findMany.mockRejectedValue(new Error("Database error"));

      const result = await getUsersByIds(["id1", "id2"]);

      expect(result).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching users by IDs:",
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it("should handle empty array", async () => {
      prismaMock.user.findMany.mockResolvedValue([]);

      const result = await getUsersByIds([]);

      expect(result).toEqual([]);
    });
  });

  describe("getUserOrders", () => {
    it("should return user orders with related data", async () => {
      const mockOrders: any = [
        {
          ...createMockOrder(),
          buyer: createMockUser(),
          fundraiser: {
            id: "423e4567-e89b-12d3-a456-426614174000",
            name: "Test Fundraiser",
            description: "A test fundraiser",
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

      const result = await getUserOrders(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      expect(result).toEqual(mockOrders);
      expect(prismaMock.order.findMany).toHaveBeenCalledWith({
        where: { buyerId: "123e4567-e89b-12d3-a456-426614174000" },
        include: {
          buyer: true,
          fundraiser: {
            select: {
              id: true,
              name: true,
              description: true,
              goalAmount: true,
              imageUrls: true,
              pickupLocation: true,
              buyingStartsAt: true,
              buyingEndsAt: true,
              pickupStartsAt: true,
              pickupEndsAt: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  authorized: true,
                  logoUrl: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when user has no orders", async () => {
      prismaMock.order.findMany.mockResolvedValue([]);

      const result = await getUserOrders(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      expect(result).toEqual([]);
    });
  });

  describe("getUserOrganizations", () => {
    it("should return organizations where user is admin", async () => {
      const mockOrganizations = [createMockOrganization()];
      prismaMock.organization.findMany.mockResolvedValue(mockOrganizations);

      const result = await getUserOrganizations(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      expect(result).toEqual(mockOrganizations);
      expect(prismaMock.organization.findMany).toHaveBeenCalledWith({
        where: {
          admins: {
            some: {
              id: "123e4567-e89b-12d3-a456-426614174000",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    });

    it("should return empty array when user has no organizations", async () => {
      prismaMock.organization.findMany.mockResolvedValue([]);

      const result = await getUserOrganizations(
        "123e4567-e89b-12d3-a456-426614174000"
      );

      expect(result).toEqual([]);
    });
  });

  describe("updateUser", () => {
    it("should update user with valid data", async () => {
      const mockUser = createMockUser();
      const updateData = {
        userId: mockUser.id,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      };

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        name: updateData.name,
        venmoUsername: updateData.venmoUsername,
      });

      const result = await updateUser(updateData);

      expect(result).toMatchObject({
        id: mockUser.id,
        name: "Updated Name",
        venmoUsername: "updated-venmo",
      });
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: updateData.name,
          venmoUsername: updateData.venmoUsername,
        },
      });
    });

    it("should set venmoUsername to null when undefined", async () => {
      const mockUser = createMockUser();
      const updateData = {
        userId: mockUser.id,
        name: "Updated Name",
        venmoUsername: undefined,
      };

      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        name: updateData.name,
        venmoUsername: null,
      });

      const result = await updateUser(updateData);

      expect(result?.venmoUsername).toBeNull();
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          name: updateData.name,
          venmoUsername: null,
        },
      });
    });
  });

  describe("findUserByEmail", () => {
    it("should return user when found by email", async () => {
      const mockUser = createMockUser();
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await findUserByEmail(mockUser.email);

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: mockUser.email,
        },
      });
    });

    it("should return null when user not found by email", async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await findUserByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should handle email case sensitivity correctly", async () => {
      const mockUser = createMockUser({ email: "Test@Example.com" });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await findUserByEmail("Test@Example.com");

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: {
          email: "Test@Example.com",
        },
      });
    });
  });
});
