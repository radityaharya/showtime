import { TraktAPI } from "@/lib/trakt/trakt";
import { NextResponse } from "next/server";
import { json } from "stream/consumers";

export async function GET(
  request: Request,
  {
    params,
    searchParams,
  }: {
    params: { uid: string };
    searchParams: URLSearchParams;
  }
) {
  // const decrypted = decrypt(encryptedToken);
  // const json = JSON.parse(decrypted);
  // const token = json.access_token;
  try {
    const days_ago = 0
    const period = 7
    const trakt = new TraktAPI();
    const shows = await trakt.get_shows_calendar(days_ago, period);
    return NextResponse.json(shows);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
