import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import TraktAPI from "@/lib/trakt/Trakt";
import { revalidatePath } from "next/cache";

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
    const data = body;

    const response = await trakt._request("/sync/history/remove", "POST", data);
    revalidatePath(`/api/user/${params.uid}/calendar/shows`);
    revalidatePath(`/api/user/${params.uid}/calendar/movies`);
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Invalid request body",
        status: "error",
        notes: JSON.stringify(error, null, 2),
      },
      { status: 500 },
    );
  }
}
