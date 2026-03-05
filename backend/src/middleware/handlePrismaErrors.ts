import { Prisma } from "../generated/client";
import { NextFunction, Request, Response } from "express-serve-static-core";

// Wraps an async route handler so any thrown error is forwarded to next()
export const asyncHandler =
  (fn: (req: any, res: any, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// Express 4-arg error-handling middleware for Prisma errors
export const handlePrismaErrors = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        res
          .status(409)
          .json({ message: "A record with this value already exists" });
        return;
      case "P2025":
        res.status(404).json({ message: "Record not found" });
        return;
      case "P2003":
        res.status(400).json({ message: "Related record not found" });
        return;
      default:
        res.status(500).json({ message: "Database error" });
        return;
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ message: "Invalid data provided" });
    return;
  }

  next(err);
};
