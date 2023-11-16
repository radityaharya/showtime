import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, customSession } from "@/app/api/auth/[...nextauth]/route";
import { getToken } from "next-auth/jwt";
import * as Sentry from "@sentry/nextjs";

const secret = process.env.NEXTAUTH_SECRET;

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: { uid: string };
  },
) {
  const session = (await getServerSession({
    req: request,
    ...authOptions,
  })) as customSession;
  const token = (await getToken({ req: request, secret })) as any;
  if (
    !session?.accessToken ||
    session.accessToken?.slug !== params.uid ||
    (token?.accessToken?.slug && token.accessToken.slug !== params.uid)
  ) {
    console.error("Unauthorized", {
      req: request.url,
    });
    return NextResponse.json(
      { error: "Unauthorized", status: "error" },
      {
        status: 401,
      },
    );
  }

  try {
    const days_ago = request.nextUrl.searchParams.get("days_ago")
      ? parseInt(request.nextUrl.searchParams.get("days_ago")!)
      : undefined;
    const period = request.nextUrl.searchParams.get("period")
      ? parseInt(request.nextUrl.searchParams.get("period")!)
      : undefined;
    const dateStart = request.nextUrl.searchParams.get("dateStart")
      ? request.url.split("dateStart=")[1].split("&")[0]
      : undefined;
    const dateEnd = request.nextUrl.searchParams.get("dateEnd")
      ? request.url?.split("dateEnd=")[1].split("&")[0]
      : undefined;

    if (
      !(
        (days_ago !== undefined && period !== undefined) ||
        (dateStart !== undefined && dateEnd !== undefined)
      )
    ) {
      throw new Error(
        "Either days_ago and period or dateStart and dateEnd must be present",
      );
    }

    const trakt = new TraktAPI(undefined, params.uid);

    const body = {
      data: await trakt.Movies.getMoviesBatch(
        days_ago,
        period,
        dateStart,
        dateEnd,
      ),
      type: "shows",
      status: "success",
    };

    Sentry.setUser({
      username: params.uid,
    });

    Sentry.setContext("request", {
      url: request.url,
      searchParams: Object.fromEntries(request.nextUrl.searchParams),
    });

    return NextResponse.json(body, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "s-maxage=1200 , stale-while-revalidate",
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
