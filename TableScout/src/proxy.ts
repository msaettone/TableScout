import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/sessionCookie";

export function proxy(req: NextRequest) {
  const hasSession = req.cookies.has(SESSION_COOKIE);
  if (!hasSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/watches/:path*", "/design-system", "/settings/:path*"],
};
