import { TraktAPI } from "@/lib/trakt/Trakt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
const Redis = require("ioredis");

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { uid: string };
  },
) {
  try {
    const days_ago = request.nextUrl.searchParams.get("days_ago")
      ? parseInt(request.nextUrl.searchParams.get("days_ago")!)
      : 30;
    const period = request.nextUrl.searchParams.get("period")
      ? parseInt(request.nextUrl.searchParams.get("period")!)
      : 90;

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

    const redis_client = new Redis(process.env.REDIS_URL, {
      keepAlive: 5000,
    });

    const cache_key = `GET:${request.url}`;

    const cachedResponse = await redis_client.get(cache_key);
    if (cachedResponse) {
      const ttl = await redis_client.ttl(cache_key);
      console.info(
        `Cache used for request: ${request.url}. TTL: ${ttl} seconds`,
      );
      const cal = new Blob([cachedResponse], { type: "text/calendar" });
      return new NextResponse(cal, {
        headers: {
          "Content-Type": "text/calendar",
          "Content-Disposition": `attachment; filename="trakt-${
            params.uid
          }-${new Date().toISOString()}.ics"`,
        },
      });
    }

    const trakt = new TraktAPI(undefined, params.uid);
    const calendarData = await trakt.Movies.getMoviesCalendar(days_ago, period);
    const cal = new Blob([calendarData.toString()], { type: "text/calendar" });

    Sentry.setUser({
      username: params.uid,
    });

    Sentry.setContext("request", {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    const response = new NextResponse(cal, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="trakt-${
          params.uid
        }-${new Date().toISOString()}.ics"`,
      },
    });

    await redis_client.set(cache_key, calendarData.toString(), "EX", 18000);

    return response;
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
