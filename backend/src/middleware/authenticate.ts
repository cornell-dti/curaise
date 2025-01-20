import { createClient } from "@supabase/supabase-js";
import { NextFunction, Request, Response } from "express-serve-static-core";

const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_KEY as string
);

// authenticates user by checking the authorization header JWT
// attaches the Supabase user object to res.locals
// note: only checks that the supabase user is authenticated, not that the user is authorized to perform an action
// makes use of type generics to allow passing of previous request types to the next middleware/handler
export const authenticate = async <ParamsT, BodyT, QueryT>(
  req: Request<ParamsT, any, BodyT, QueryT>,
  res: Response,
  next: NextFunction
) => {
  const {
    data: { user },
  } = await supabase.auth.getUser(req.headers.authorization);

  if (!user) {
    res.status(401).json({ message: "Invalid authorization token" });
    return;
  }

  res.locals.user = user;

  next();
};
