import { User } from "@supabase/supabase-js";

// use declaration merging to add a Supabase user property to the Express Locals interface (for res.locals)
declare global {
  namespace Express {
    interface Locals {
      user?: User;
    }
  }
}
