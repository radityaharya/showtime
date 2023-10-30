// This endpoint is used as a compatibility layer for https://github.com/radityaharya/trakt_ical
// This will be removed in the future

import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongo/mongoPromise";
import * as Sentry from "@sentry/nextjs";

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { _: string };
  },
) {
  try {
    const days_ago = request.nextUrl.searchParams.get("days_ago")
      ? parseInt(request.nextUrl.searchParams.get("days_ago")!)
      : 30;
    const period = request.nextUrl.searchParams.get("period")
      ? parseInt(request.nextUrl.searchParams.get("period")!)
      : 30;
    const key = request.nextUrl.searchParams.get("key");
    const userAgent = headers().get("user-agent") || "";
    Sentry.setTag("user-agent", userAgent);
    if (/Mozilla|Chrome|Safari|Firefox|Edge/.test(userAgent)) {
      throw new Error(
        "Browser not supported for this route, use this link to Import the calendar",
      );
    }

    console.log(`days_ago: ${days_ago} | period: ${period}`);
    if (![days_ago, period].every(Number.isSafeInteger)) {
      throw new Error("days_ago and period must be safe integers");
    }

    const client = await clientPromise;
    const db = client.db(process.env.NEXTAUTH_DB);
    const collection = db.collection("nextauth_users");

    const user = await collection.findOne({ user_id: key });
    if (!user) {
      throw new Error("User not found");
    }

    const trakt = new TraktAPI(undefined, user.name);
    const cal = (
      await trakt.Movies.getMoviesCalendar(days_ago, period)
    ).toBlob();

    Sentry.setContext("request", {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });
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
    Sentry.setContext("request", {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });
    return NextResponse.json({
      error: error instanceof Error ? error.message : error,
      status: "error",
    });
  }
}
