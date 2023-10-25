/* eslint-disable */
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const WHITELIST = [
  "/api/auth/*",
  "/",
  "_next/",
  "favicon.ico",
  "/auth/*",
  "/monitoring",
  "/api/monitoring",
]

export default withAuth(
  // `withAuth` augments your `Request` with the user's token.
  function middleware(req) {
    if (req.url.includes("/api/user/")) {
      const user = req.url.split("/")[3];
      const path = req.url.split("/")[5];
      const baseUrl = req.url.split("/")[0] + "//" + req.url.split("/")[2];
      const authUrl = `${baseUrl}/auth`;
      console.log("authUrl", authUrl);
      if (req.nextauth.token) {
        if (req.nextauth.token.name !== user) {
          return NextResponse.json({ error: "Unauthorized", "status":"error" }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: "Unauthorized", "status":"error" }, { status: 401 });
      }
    } else if (WHITELIST.some((path) => req.url.includes(path))) {
      return NextResponse.next();
    } else {
      return NextResponse.next();
    }
  },

  {
    callbacks: {
      authorized: ({ token }) => {
        return true;
      }
    },
    pages: {
      signIn: '/auth',
    }
  },
);

export const config = {
  matcher: ['/api/user/:path*/calendar/:path*'],
};