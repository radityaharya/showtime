import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";
// const Redis = require("ioredis");

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { uid: string };
  },
) {
  // const decrypted = decrypt(encryptedToken);
  // const json = JSON.parse(decrypted);
  // const token = json.access_token;
  try {
    const days_ago = request.url.includes("days_ago")
      ? parseInt(request.url.split("days_ago=")[1].split("&")[0])
      : undefined;
    const period = request.url.includes("period")
      ? parseInt(request.url.split("period=")[1].split("&")[0])
      : undefined;
    const dateStart = request.url.includes("dateStart")
      ? request.url.split("dateStart=")[1].split("&")[0]
      : undefined;
    const dateEnd = request.url.includes("dateEnd")
      ? request.url.split("dateEnd=")[1].split("&")[0]
      : undefined;

    if (
      !(
        (days_ago !== undefined && period !== undefined) ||
        (dateStart !== undefined && dateEnd !== undefined)
      )
    ) {
      throw new Error(
        "Either days_ago and period or dateStart() and dateEnd must be present",
      );
    }

    const trakt = new TraktAPI(undefined, params.uid);

    const body = {
      data: await trakt.Shows.getShowsBatch(
        days_ago,
        period,
        dateStart,
        dateEnd,
      ),
      type: "shows",
      status: "success",
    };

    // await redis.set(key, JSON.stringify(body), "EX", 1200);

    return NextResponse.json(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=1200 , stale-while-revalidate",
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
