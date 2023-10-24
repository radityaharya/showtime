import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { uid: string };
  },
) {
  try {
    const days_ago = request.url.includes("days_ago")
      ? parseInt(request.url.split("days_ago=")[1].split("&")[0])
      : 1;
    const period = request.url.includes("period")
      ? parseInt(request.url.split("period=")[1].split("&")[0])
      : 5;

    console.log(`days_ago: ${days_ago} | period: ${period}`);
    if (![days_ago, period].every(Number.isInteger)) {
      throw new Error("days_ago and period must be integers");
    }

    const trakt = new TraktAPI(undefined, params.uid);
    const cal = (await trakt.Shows.getShowsCalendar(days_ago, period)).toBlob();
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
    return NextResponse.json({
      error: error instanceof Error ? error.message : error,
      status: "error",
    });
  }
}
