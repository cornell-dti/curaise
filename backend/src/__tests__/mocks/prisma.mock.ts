import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";

/**
 * Mocked Prisma Client for testing
 *
 * This provides a fully mocked Prisma client that can be used in tests
 * without requiring an actual database connection.
 */
export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

/**
 * Mock the Prisma utility module
 *
 * This ensures that any imports of '../utils/prisma' will receive the mocked client
 */
jest.mock("../../utils/prisma", () => ({
  __esModule: true,
  prisma: prismaMock,
}));

/**
 * Reset Prisma mock before each test
 */
export const resetPrismaMock = () => {
  mockReset(prismaMock);
};
