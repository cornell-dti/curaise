import { User, Order, Organization } from "@prisma/client";

/**
 * Test data factory functions
 *
 * These functions create mock data objects that match Prisma's generated types.
 * Use these in tests to create consistent, valid test data.
 */

/**
 * Create a mock User object
 *
 * @param overrides - Optional properties to override default values
 * @returns A User object with test data
 *
 * @example
 * const user = createMockUser({ name: 'John Doe' });
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "123e4567-e89b-12d3-a456-426614174000",
  email: "test@example.com",
  name: "Test User",
  venmoUsername: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

/**
 * Create multiple mock User objects
 *
 * @param count - Number of users to create
 * @returns An array of User objects
 *
 * @example
 * const users = createMockUsers(3);
 */
export const createMockUsers = (count: number): User[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `123e4567-e89b-12d3-a456-42661417400${i}`,
      email: `test${i}@example.com`,
      name: `Test User ${i}`,
    })
  );
};

/**
 * Create a mock Organization object
 *
 * @param overrides - Optional properties to override default values
 * @returns An Organization object with test data
 *
 * @example
 * const org = createMockOrganization({ name: 'My Org' });
 */
export const createMockOrganization = (
  overrides?: Partial<Organization>
): Organization => ({
  id: "223e4567-e89b-12d3-a456-426614174000",
  name: "Test Organization",
  description: "A test organization",
  authorized: true,
  logoUrl: "https://example.com/logo.png",
  websiteUrl: "https://example.com",
  instagramUsername: "testorg",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});

/**
 * Create a mock Order object
 *
 * @param overrides - Optional properties to override default values
 * @returns An Order object with test data
 *
 * @example
 * const order = createMockOrder({ paymentStatus: 'CONFIRMED' });
 */
export const createMockOrder = (overrides?: Partial<Order>): Order => ({
  id: "323e4567-e89b-12d3-a456-426614174000",
  paymentMethod: "VENMO" as const,
  paymentStatus: "PENDING" as const,
  pickedUp: false,
  buyerId: "123e4567-e89b-12d3-a456-426614174000",
  fundraiserId: "423e4567-e89b-12d3-a456-426614174000",
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  ...overrides,
});
