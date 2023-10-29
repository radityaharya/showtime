import { PreviewItem } from "./previewItem";
import { MovieData, ShowData } from "@/app/types/schedule";
import { useMemo, FC } from "react";

interface Props {
  Shows: ShowData | MovieData;
}

const ScheduleItems: FC<Props> = ({ Shows }) => {
  const formattedDate = useMemo(() => {
    return new Date(Shows.dateUnix * 1000).toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [Shows.dateUnix]);

  const numShowsAiring = useMemo(() => {
    return `${Shows.items.length} Shows Airing`;
  }, [Shows.items.length]);

  return (
    <div className="self-stretch md:w-full overflow-hidden flex flex-col items-start justify-center md:justify-start gap-6">
      <div className="box-border md:mx-auto md:w-full flex flex-col items-start justify-center py-[13px] px-0 text-left text-slate-100 font-text-sm-font-normal self-stretch border-b-[2px] border-solid border-gray">
        <div className="relative font-semibold text-2xl">{formattedDate}</div>
        <div className="relative leading-[24px] font-medium text-sm text-gray-300">
          {numShowsAiring}
        </div>
      </div>

      <div className="self-stretch md:py-2 flex w-full flex-row items-start justify-center md:justify-start gap-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 w-full">
          {Shows?.items.map((show) => (
            <div key={show.ids.tmdb} className="">
              <PreviewItem
                item={{
                  itemLogo: show.logo
                    ? show.logo
                    : "https://placehold.co/154.77x60",
                  itemBackdrop: show.background
                    ? show.background
                    : "https://placehold.co/409x292",
                  airingAt: show.airsAtUnix as number,
                  pillInfo: show.network ? show.network : "N/A",
                  title: show.title,
                  episodeNumber: show?.number?.toString() || "N/A",
                  subtitle: show.show || "N/A",
                  seasonNumber: show?.season?.toString() || "N/A",
                  episodeIds: show.episodeIds,
                  ids: show.ids,
                  watched: show.watched,
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleItems;
