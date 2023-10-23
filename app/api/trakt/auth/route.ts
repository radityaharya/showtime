import { NextResponse } from "next/server";

export async function GET(request: Request) {
  return NextResponse.redirect(
    `https://trakt.tv/oauth/authorize?response_type=code&client_id=${process.env.TRAKT_CLIENT_ID}&redirect_uri=${process.env.HOST}/api/trakt/callback`,
  );
}
