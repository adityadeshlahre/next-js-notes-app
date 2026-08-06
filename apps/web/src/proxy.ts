import { evlogMiddleware } from "evlog/next";
import { NextRequest } from "next/server";

import { authGuard } from "@/lib/auth-guard";

export async function proxy(request: NextRequest) {
  const guard = authGuard(request);
  if (guard) return guard;

  return evlogMiddleware()(request);
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*"],
};
