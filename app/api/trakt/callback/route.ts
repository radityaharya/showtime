// /callback
import { Collection } from "@/lib/mongo/mongo";
import { TraktAPI } from "@/lib/trakt/Trakt";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: { code: string };
  }
) {
  const code = request.url.split("?code=")[1];
  const data = {
    code: code,
    client_id: process.env.TRAKT_CLIENT_ID,
    client_secret: process.env.TRAKT_CLIENT_SECRET,
    redirect_uri: process.env.HOST + "/api/trakt/callback",
    grant_type: "authorization_code",
  };

  try {
    const response = await fetch("https://api.trakt.tv/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const access_token = await response.json();
    const col = await Collection("users");
    const user_access_token = access_token.access_token;
    const trakt = new TraktAPI(user_access_token);
    const user_slug = (await trakt.getUserInfo()).ids.slug;

    const user = await col.findOne({ slug: user_slug });
    if (user) {
      await col.updateOne(
        { slug: user_slug },
        {
          $set: {
            access_token: access_token,
          },
        }
      );
    } else {
      await col.insertOne({
        slug: user_slug,
        access_token: access_token,
      });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : error,
        status: "error",
      },
      { status: 500 }
    );
  }
  return NextResponse.redirect(
    new URL("/", request.url.split("/callback")[0]).href
  );
}
