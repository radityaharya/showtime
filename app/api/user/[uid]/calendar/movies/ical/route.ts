import { TraktAPI } from "@/lib/trakt/Trakt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

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

    const trakt = new TraktAPI(undefined, params.uid);
    const cal = (await trakt.Shows.getShowsCalendar(days_ago, period)).toBlob();

    Sentry.setUser({
      username: params.uid,
    });

    Sentry.setContext("request", {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    return new NextResponse(cal, {
      headers: {
        "Content-Type": "text/calendar",
        "Content-Disposition": `attachment; filename="trakt-${
          params.uid
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
