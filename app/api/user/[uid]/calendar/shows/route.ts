import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getToken } from "next-auth/jwt";
// const Redis = require("ioredis");
const secret = process.env.NEXTAUTH_SECRET;

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { uid: string };
  },
) {
  const session = await getServerSession({ req: request, ...authOptions });
  const token = await getToken({ req: request, secret });
  if (
    !session?.user ||
    session.user.name !== params.uid ||
    (token?.name && token.name !== params.uid)
  ) {
    console.log("Unauthorized", {
      session,
      token,
      req: request.url,
    });
    return NextResponse.json({ error: "Unauthorized", status: "error" });
  }

  try {
    const days_ago = request.url?.includes("days_ago")
      ? parseInt(request.url.split("days_ago=")[1].split("&")[0])
      : undefined;
    const period = request.url?.includes("period")
      ? parseInt(request.url.split("period=")[1].split("&")[0])
      : undefined;
    const dateStart = request.url?.includes("dateStart")
      ? request.url.split("dateStart=")[1].split("&")[0]
      : undefined;
    const dateEnd = request.url?.includes("dateEnd")
      ? request.url?.split("dateEnd=")[1].split("&")[0]
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
