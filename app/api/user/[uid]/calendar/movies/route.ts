import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";
import { Collection } from "@/lib/mongo/mongo";
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

    // const key = `trakt-${request.url.split("/api")[1]}`;

    // const redis = new Redis(process.env.REDIS_URL);

    // const cached = await redis.get(key);

    // if (cached) {
    //   console.log(`cached: ${key}`);
    //   return NextResponse.json(JSON.parse(cached), {
    //     headers: {
    //       "Content-Type": "application/json",
    //       "Cache-Control": "s-maxage=1200 , stale-while-revalidate",
    //       "X-Redis-Cache": "HIT",
    //     },
    //   });
    // }

    const trakt = new TraktAPI(user.access_token);

    const body = {
      data: await trakt.Movies.getMoviesBatch(days_ago, period),
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
