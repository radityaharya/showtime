import { NextRequest, NextResponse } from "next/server";

/* eslint-disable */
export default async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const session = !!req.cookies.get("next-auth.session-token");

  if (path === "/" || path.endsWith("/ical")) {
    return NextResponse.next();
  }

  if (!session) {
    if (path.startsWith("/api")) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          status: "error",
        },
        {
          status: 401,
        },
      );
    }
    return NextResponse.redirect(new URL(`/auth`, req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
    "/api/user/:path*/calendar/:path*",
  ],
};
