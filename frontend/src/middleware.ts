import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// run supabase auth middleware on only these routes (the protected routes)
export const config = {
  matcher: [
    "/login",
    "/buyer",
    "/buyer/order/:path*",
    "/buyer/account",
    "/seller/:path*",
  ],
};
