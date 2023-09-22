import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";
import { Collection } from "@/lib/mongo/mongo";
export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { uid: string };
  }
) {
  // const decrypted = decrypt(encryptedToken);
  // const json = JSON.parse(decrypted);
  // const token = json.access_token;
  try {
    const days_ago = request.url.includes("days_ago") ? parseInt(searchParams.get("days_ago")!) : 1
    const period = request.url.includes("period") ? parseInt(searchParams.get("period")!) : 5

    const col = await Collection("users");
    const user = await col.findOne({ slug: params.uid });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const token = user.access_token.access_token;
    const trakt = new TraktAPI(token);
    return NextResponse.json(
      {
        data: await trakt.Shows.getShowsBatch(days_ago, period),
        type: "shows",
        status: "success",
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "s-maxage=1200 , stale-while-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : error,
      status: "error",
    });
  }
}