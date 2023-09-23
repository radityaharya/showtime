import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";
import { Collection } from "@/lib/mongo/mongo";
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

    const col = await Collection("users");
    const user = await col.findOne({ slug: params.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const token = user.access_token.access_token;
    const trakt = new TraktAPI(token);
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
