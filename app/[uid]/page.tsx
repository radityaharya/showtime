import Image from "next/image";
import { YoutubePlayer } from "../../components/YtPlayer_client";
import { Skeleton } from "@/components/ui/skeleton";
import TraktAPI from "../../lib/trakt/Trakt";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { ShowData } from "../types/schedule";
import { Collection } from "@/lib/mongo/mongo";
import { redirect } from 'next/navigation'
import { NextApiResponse } from "next";
import { notFound } from 'next/navigation'
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


type PageProps = {
  params: {
    uid: string
  }
}
export default async function UserPage({ params: { uid } }: PageProps) {

  const users = await Collection("users");
  const user = await users.findOne({ slug: uid });

  const session = await getServerSession(authOptions);
  
  console.log(session)

  if (!session) {
    return redirect("/api/auth/signin");
  }

  if (!user) {
    return notFound();
  }

  const accessToken = user?.access_token;

  const trakt = new TraktAPI(accessToken);
  const shows = (await trakt.Shows.getShowsBatch(5, 40)) as any;

  return (
    <div>
      {hero()}
      <div className="relative pb-5 pt-16 px-2 md:px-20 bg-black w-full overflow-hidden flex flex-col text-left text-sm text-gray-100 font-text-2xl-font-semibold gap-10">
        {shows.map((showData: ShowData) => (
          <ScheduleItems key={showData.dateUnix} Shows={showData} />
        ))}
      </div>
    </div>
  );
}

function hero() {
  return (
    <div className="relative pb-10 pt-16 px-2 md:px-20 bg-black w-full h-screen min-h-screen overflow-hidden flex flex-col text-left text-sm text-gray-100 font-text-2xl-font-semibold">
      <div
        className="absolute top-0 left-0 w-full h-full z-[5]"
        style={{
          background: `linear-gradient(to top, #000000 0%, transparent 100%)`,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />
      <YoutubePlayer videoId="4IlF715Yn00" />
      <div className="self-stretch h-full flex flex-col items-center justify-between z-10">
        <div className="self-stretch flex flex-row items-center justify-between">
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="relative font-medium text-gray-300">
              Currently Airing
            </div>
            <div className="flex flex-col items-start justify-start gap-1 text-zinc-200">
              <h1 className="self-stretch relative text-4xl font-bold">
                The Boys
              </h1>
              <div className="self-stretch relative text-xl font-medium text-gray-100">
                Godolkin University - Orientation Video
              </div>
            </div>
          </div>
          <Image
            src="https://www.themoviedb.org/t/p/h50_filter(negate,000,666)/ifhbNuuVnlwYy5oXA5VIb2YR8AZ.png"
            width={100}
            height={100}
            alt="network"
          />
        </div>
        <div className="self-stretch flex flex-row items-end justify-between text-sm text-white">
          <div className="relative underline font-medium">Details</div>
          <div className="flex flex-row items-end justify-center gap-[24px] text-base text-gray-100">
            <div className="flex-1 flex flex-col items-end justify-start">
              <div className="relative font-semibold">Next Up</div>
              <div className="flex flex-col items-end justify-start text-white">
                <p className="font-bold">Loki</p>
                <div className="relative text-md font-medium text-gray-100">
                  S02E01: Episode 1
                </div>
              </div>
            </div>
            <div className="relative h-[150.51px] w-[100px] rounded-md overflow-hidden bg-gray-100">
              <Image
                src="https://www.themoviedb.org/t/p/original/voHUmluYmKyleFkTu3lOXQG702u.jpg"
                width={100}
                height={150.51}
                alt="next up poster"
                className="rounded-md object-cover absolute z-[3]"
              />
              <Skeleton className="absolute h-[150.51px] w-[100px] z-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
