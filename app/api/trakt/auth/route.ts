import { TraktAPI } from "@/lib/trakt/trakt";
import { NextResponse } from "next/server";



// https://trakt.tv/oauth/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={os.environ.get("HOST")}

export async function GET(request: Request
) {
  return NextResponse.redirect(`https://trakt.tv/oauth/authorize?response_type=code&client_id=${process.env.TRAKT_CLIENT_ID}&redirect_uri=${process.env.HOST}/api/trakt/callback`)
}