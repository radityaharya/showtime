import PreviewItem from "./previewItem";
import { MovieData, ShowData } from "@/app/types/schedule";

interface Props {
  Shows: ShowData | MovieData;
}

const ScheduleItems: React.FC<Props> = ({ Shows }) => {
  return (
    <div className="self-stretch overflow-hidden flex flex-col items-start justify-center md:justify-start gap-[2.5rem]">
      <div className="box-border w-[395px] mx-auto md:w-full flex flex-col items-start justify-center py-[13px] px-0 text-left text-slate-100 font-text-sm-font-normal self-stretch border-b-[2px] border-solid border-gray">
        <div className="relative font-semibold text-2xl">
          {new Date(Shows.dateUnix * 1000).toLocaleDateString("en-US", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </div>
        <div className="relative leading-[24px] font-medium text-sm text-gray-300">
          {Shows.items.length} Shows Airing
        </div>
      </div>

      <div className="self-stretch py-2 flex flex-row items-start justify-center md:justify-start gap-5">
        <div className="flex flex-row items-start justify-center md:justify-start gap-5 flex-wrap">
          {Shows?.items.map((show) => (
            <PreviewItem
              key={show.airsAtUnix}
              itemLogo={
                show.logo ? show.logo : "https://placehold.co/154.77x60"
              }
              itemBackdrop={
                show.background
                  ? show.background
                  : "https://placehold.co/409x292"
              }
              airingAt={show.airsAtUnix as number}
              pillInfo={show.network ? show.network : "N/A"}
              title={show.title}
              episodeNumber={show?.number?.toString() || "N/A"}
              subtitle={show.show || "N/A"}
              seasonNumber={show?.season?.toString() || "N/A"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScheduleItems;
