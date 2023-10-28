import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import TraktAPI from "@/lib/trakt/Trakt";
import { z } from "zod";

const schema = z.object({
  movies: z.array(
    z.object({
      watched_at: z.string().optional(),
      title: z.string().optional(),
      year: z.number().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        slug: z.string().optional(),
        imdb: z.string().optional(),
        tmdb: z.number().optional(),
      }),
    }),
  ),
  shows: z.array(
    z.object({
      watched_at: z.string().optional(),
      title: z.string().optional(),
      year: z.number().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        slug: z.string().optional(),
        tvdb: z.number().optional(),
        imdb: z.string().optional(),
        tmdb: z.number().optional(),
      }),
      seasons: z.array(
        z.object({
          watched_at: z.string().optional(),
          number: z.number(),
          episodes: z.array(
            z.object({
              watched_at: z.string().optional(),
              number: z.number(),
            }),
          ),
        }),
      ),
    }),
  ),
  seasons: z.array(
    z.object({
      watched_at: z.string().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        tvdb: z.number().optional(),
        tmdb: z.number().optional(),
      }),
    }),
  ),
  episodes: z.array(
    z.object({
      watched_at: z.string().optional(),
      ids: z.object({
        trakt: z.number().optional(),
        tvdb: z.number().optional(),
        imdb: z.string().optional(),
        tmdb: z.number().optional(),
      }),
    }),
  ),
});

const secret = process.env.NEXTAUTH_SECRET;
export async function POST(
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

  const trakt = new TraktAPI(undefined, params.uid);

  const body = await request.json();

  try {
    const data = schema.parse(body);

    const response = await trakt._request("/sync/history", "POST", data);

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Invalid request body",
        status: "error",
        notes: error,
      },
      { status: 500 },
    );
  }
}
