/**
 * Mocked Supabase Auth for testing
 *
 * This provides a mocked Supabase authentication client that can be
 * configured on a per-test basis.
 */

export const mockSupabaseAuth = {
  getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
};

const mockSupabaseClient = {
  auth: mockSupabaseAuth,
};

/**
 * Mock the Supabase SDK
 *
 * This ensures that any calls to createClient() will return our mocked client
 */
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

/**
 * Reset Supabase mock to default state (no authenticated user)
 */
export const resetSupabaseMock = () => {
  mockSupabaseAuth.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
};

/**
 * Helper to create a mock Supabase user object
 */
export const createMockSupabaseUser = (
  userId: string = "123e4567-e89b-12d3-a456-426614174000"
) => ({
  id: userId,
  email: "test@example.com",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
});
