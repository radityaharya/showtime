// This endpoint is used as a compatibility layer for https://github.com/radityaharya/trakt_ical
// This will be removed in the future

import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongo/mongoPromise";

export async function GET(request: NextRequest) {
  try {
    const days_ago = request.url?.includes("days_ago")
      ? parseInt(request.url.split("days_ago=")[1].split("&")[0])
      : 30;
    const period = request.url?.includes("period")
      ? parseInt(request.url.split("period=")[1].split("&")[0])
      : 30;
    const key = request.url?.includes("key")
      ? request.url.split("key=")[1].split("&")[0]
      : undefined;
    const userAgent = headers().get("user-agent") || "";
    if (/Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent)) {
      throw new Error(
        "Browser not supported for this route, use this link to Import the calendar",
      );
    }

    console.log(`days_ago: ${days_ago} | period: ${period}`);
    if (![days_ago, period].every(Number.isInteger)) {
      throw new Error("days_ago and period must be integers");
    }

    const client = await clientPromise;
    const db = client.db(process.env.NEXTAUTH_DB);
    const collection = db.collection("nextauth_users");

    const user = await collection.findOne({ user_id: key });
    if (!user) {
      throw new Error("User not found");
    }

    const trakt = new TraktAPI(undefined, user.name);
    const cal = (await trakt.Shows.getShowsCalendar(days_ago, period)).toBlob();
    return new NextResponse(cal, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="trakt-${
          user.name
        }-${new Date().toISOString()}.ics"`,
      },
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : error,
      status: "error",
    });
  }
}
