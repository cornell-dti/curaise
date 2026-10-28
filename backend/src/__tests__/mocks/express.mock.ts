/**
 * Express.js test utilities
 *
 * Provides mock implementations of Express request, response, and next function
 * for use in handler and middleware tests.
 */

/**
 * Create a mock Express request object
 *
 * @param overrides - Optional properties to override default request values
 * @returns A mock request object with common properties
 *
 * @example
 * const req = mockRequest({ params: { id: '123' }, body: { name: 'Test' } });
 */
export const mockRequest = <T = any>(overrides?: Partial<T>): T =>
  ({
    params: {},
    query: {},
    body: {},
    headers: {},
    ...overrides,
  } as T);

/**
 * Create a mock Express response object
 *
 * @returns A mock response object with chainable methods
 *
 * @example
 * const res = mockResponse();
 * await handler(req, res);
 * expect(res.status).toHaveBeenCalledWith(200);
 */
export const mockResponse = () => {
  const res: any = {
    locals: {},
  };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock Express next function
 *
 * @returns A jest mock function for the next callback
 *
 * @example
 * const next = mockNext();
 * await middleware(req, res, next);
 * expect(next).toHaveBeenCalled();
 */
export const mockNext = () => jest.fn();
