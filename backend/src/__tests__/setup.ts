/**
 * Global test setup
 *
 * This file is automatically loaded by Jest before each test suite.
 * It configures all necessary mocks and resets them between tests.
 */

// Import and configure mocks
import "./mocks/prisma.mock";
import "./mocks/supabase.mock";

// Re-export mocks for use in tests
export { prismaMock, resetPrismaMock } from "./mocks/prisma.mock";
export {
  mockSupabaseAuth,
  resetSupabaseMock,
  createMockSupabaseUser,
} from "./mocks/supabase.mock";
export { mockRequest, mockResponse, mockNext } from "./mocks/express.mock";

// Re-export fixtures for use in tests
export {
  createMockUser,
  createMockUsers,
  createMockOrganization,
  createMockOrder,
} from "./fixtures";

// Import reset functions
import { resetPrismaMock } from "./mocks/prisma.mock";
import { resetSupabaseMock } from "./mocks/supabase.mock";

/**
 * Reset all mocks before each test
 */
beforeEach(() => {
  resetPrismaMock();
  resetSupabaseMock();
});
