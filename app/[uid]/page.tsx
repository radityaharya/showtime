import Image from "next/image";
import { YoutubePlayer } from "../../components/YtPlayer_client";
import TraktAPI from "../../lib/trakt/Trakt";
import { ShowItem } from "../types/schedule";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Suspense } from "react";
import ScheduleView from "@/components/schedule/scheduleView";
import TmdbAPI from "@/lib/tmdb/Tmdb";
import clientPromise from "@/lib/mongo/mongoPromise";
import { CountDownTimer } from "@/components/CountDownTimer";

type PageProps = {
  params: {
    uid: string;
  };
};
export default async function UserPage({ params: { uid } }: PageProps) {
  const db = (await clientPromise).db(process.env.NEXTAUTH_DB);
  const collection = db.collection("nextauth_accounts");
  const session = await getServerSession(authOptions);

  const user = session?.user;

  if (!session) {
    return redirect("/auth");
  }

  if (!user) {
    return notFound();
  }

  if (user.name !== uid) {
    return redirect("/auth");
  }

  const slug = user?.name as string;
  const nextauthAccount = await collection.findOne({
    providerAccountId: user?.name,
    provider: "trakt",
  });

  if (!nextauthAccount) {
    return redirect("/auth");
  }

  const trakt = new TraktAPI(undefined, slug);
  const shows = (await trakt.Shows.getShowsBatch(2, 10)) as any;
  const tmdb = new TmdbAPI();

  const now = Date.now() / 1000;
  const sortedShows = shows.sort((a: any, b: any) => a.dateUnix - b.dateUnix);
  const nextShow = sortedShows.find(
    ({ dateUnix }: { dateUnix: number }) => dateUnix >= now,
  );
  const firstShow = nextShow?.items[0] || [];

  const video = await tmdb.tv.getTvVideos(firstShow.ids.tmdb);
  const episodeVideo = await tmdb.tv.getEpisodeVideos(
    firstShow.ids.tmdb,
    firstShow.season,
    firstShow.number,
  );

  const ytVideo = video.results.find(
    (v: any) => v.site === "YouTube" && v.iso_3166_1 === "US",
  );
  const ytEpisodeVideo = episodeVideo.results.find(
    (v: any) => v.site === "YouTube" && v.iso_3166_1 === "US",
  );

  const videoId = ytEpisodeVideo?.key || ytVideo?.key;

  return (
    <div>
      {hero(firstShow, videoId)}
      <div className="relative pb-5 pt-16 px-2 md:px-20 bg-black w-full overflow-hidden flex flex-col text-left text-sm text-gray-100 font-text-2xl-font-semibold gap-10">
        <Suspense fallback={<p>Loading feed...</p>}>
          <ScheduleView initItems={shows} />
        </Suspense>
      </div>
    </div>
  );
}

function hero(itemData: ShowItem, videoId: string) {
  return (
    <div className="relative pb-10 pt-8 md:pt-16 px-4 md:px-20 bg-black w-full h-[100svh] min-h-[100svh] overflow-hidden flex flex-col text-left text-sm text-gray-100 font-text-2xl-font-semibold">
      <div
        className="absolute top-0 left-0 w-full h-full z-[5]"
        style={{
          background: `linear-gradient(to top, #000000 0%, transparent 100%)`,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />
      <YoutubePlayer
        videoId={videoId}
        fallbackImg={itemData.background as string}
      />
      <div className="self-stretch h-full flex flex-col items-center justify-between z-10">
        <div className="self-stretch flex flex-row items-center justify-between">
          <div className="flex flex-col items-start justify-start gap-2">
            <div className="relative flex flex-row gap-2 font-medium text-gray-300">
              Airing in
              <span>
                <CountDownTimer airsAt={itemData.airsAt} />
              </span>
            </div>
            <div className="flex flex-col items-start justify-start gap-1 text-zinc-200">
              <h1 className="self-stretch relative text-4xl font-bold">
                {itemData.show}
              </h1>
              <div className="self-stretch relative text-xl font-medium text-gray-100">
                {`S${itemData.number
                  .toString()
                  .padStart(2, "0")}E${itemData.season
                  .toString()
                  .padStart(2, "0")}: ${itemData.title}`}
              </div>
            </div>
          </div>
          <Image
            src={
              itemData.networkLogo.replace(
                "/p/",
                "/p/h50_filter(negate,000,666)/",
              ) as string
            }
            width={100}
            height={100}
            alt="network"
          />
        </div>
        <div className="self-stretch flex flex-row items-end justify-between text-sm text-white">
          <div className="relative underline font-medium">Details</div>
        </div>
      </div>
    </div>
  );
}
