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

type PageProps = {
  params: {
    uid: string;
  };
};
export default async function UserPage({ params: { uid } }: PageProps) {
  const db = (await clientPromise).db("test");
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
    return redirect(`/user/${user?.name}`);
  }

  const slug = user?.name as string;
  const nextauthAccount = await collection.findOne({
    providerAccountId: user?.name,
    provider: "trakt",
  });

  if (!nextauthAccount) {
    return notFound();
  }

  const accessToken = {
    slug,
    access_token: nextauthAccount?.access_token,
    refresh_token: nextauthAccount?.refresh_token,
    // expires_at: nextauthAccount?.expires_at,
    expires_in:
      (nextauthAccount?.expires_at as number) - Math.floor(Date.now() / 1000),
    token_type: nextauthAccount?.token_type,
    scope: nextauthAccount?.scope,
    created_at: nextauthAccount?.created_at,
  };

  const trakt = new TraktAPI(accessToken);
  const shows = (await trakt.Shows.getShowsBatch(2, 10)) as any;
  const tmdb = new TmdbAPI();

  const now = new Date().getTime() / 1000;
  const first = shows.find((show: any) => show.dateUnix > now) || shows[0];
  const firstShow =
    first.items.find((item: any) => item.dateUnix > now) || first.items[0];

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
            <div className="relative font-medium text-gray-300">
              Currently Airing
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
          {/* <div className="flex flex-row items-end justify-center gap-[24px] text-base text-gray-100">
            <div className="flex-1 flex flex-col items-end justify-start">
              <div className="relative font-semibold">Next Up</div>
              <div className="flex flex-col items-end justify-start text-white">
                <p className="font-bold">Loki</p>
                <div className="relative text-md font-medium text-gray-100">
                  {`S${itemData.number.toString().padStart(2, "0")}E${itemData.season.toString().padStart(2, "0")}: ${itemData.title}`}
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
          </div> */}
        </div>
      </div>
    </div>
  );
}
