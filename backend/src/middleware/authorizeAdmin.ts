import { NextFunction, Request, Response } from "express-serve-static-core";

const getAdminEmails = (): string[] => {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
};

// Checks if the authenticated user's email is in the ADMIN_EMAILS env var.
// Must be used after the `authenticate` middleware.
export const authorizeAdmin = async <ParamsT, BodyT, QueryT>(
  _req: Request<ParamsT, any, BodyT, QueryT>,
  res: Response,
  next: NextFunction,
) => {
  const user = res.locals.user;
  if (!user?.email) {
    res.status(403).json({ message: "Forbidden: admin access required" });
    return;
  }

  const adminEmails = getAdminEmails();
  if (!adminEmails.includes(user.email.toLowerCase())) {
    res.status(403).json({ message: "Forbidden: admin access required" });
    return;
  }

  next();
};
