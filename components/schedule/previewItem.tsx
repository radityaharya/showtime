import Image from "next/image";
import { format } from "date-fns";
import { Suspense, useContext } from "react";
import LazyLoad from "react-lazy-load";
import { useEffect, useState } from "react";
import { Img, buildImageUrl } from "../ImageProxy";
import dynamic from "next/dynamic";
import { AppContext, type AppContextValue } from "../provider";

interface PreviewItemType {
  itemLogo: string;
  itemBackdrop: string;
  airingAt: number;
  pillInfo: string;
  title: string;
  episodeNumber?: string;
  subtitle?: string;
  seasonNumber?: string;
  ids?: any;
  onClick?: () => void;
}

export const PreviewItem: React.FC<PreviewItemType> = ({
  itemLogo,
  itemBackdrop,
  airingAt,
  pillInfo,
  title,
  episodeNumber,
  subtitle,
  seasonNumber,
  ids,
}) => {
  const [isClient, setIsClient] = useState(false);
  const { state, setState } = useContext(AppContext) as AppContextValue;

  useEffect(() => {
    setIsClient(true);
  }, []);

  function handleModal() {
    console.log("clicked");
    setState({
      ...state,
      itemModal: {
        ...state.itemModal,
        show: true,
        data: {
          title: title,
          background: itemBackdrop,
          logo: itemLogo,
          airsAtUnix: airingAt,
          network: pillInfo,
          number: episodeNumber,
          show: subtitle,
          season: seasonNumber,
          ids: ids,
        },
      },
    });
  }

  return (
    <>
      {isClient ? (
        <LazyLoad height={292} offset={300} className="w-full md:w-[395px]">
          <PreviewItemContent
            itemLogo={itemLogo}
            itemBackdrop={itemBackdrop}
            airingAt={airingAt}
            pillInfo={pillInfo}
            title={title}
            episodeNumber={episodeNumber}
            subtitle={subtitle}
            seasonNumber={seasonNumber}
            ids={ids}
            onClick={handleModal}
          />
        </LazyLoad>
      ) : (
        <PreviewItemContent
          itemLogo={itemLogo}
          itemBackdrop={itemBackdrop}
          airingAt={airingAt}
          pillInfo={pillInfo}
          title={title}
          episodeNumber={episodeNumber}
          subtitle={subtitle}
          seasonNumber={seasonNumber}
          ids={ids}
          onClick={handleModal}
        />
      )}
    </>
  );
};

const PreviewItemContent: React.FC<PreviewItemType> = ({
  itemLogo,
  itemBackdrop,
  airingAt,
  pillInfo,
  title,
  episodeNumber,
  subtitle,
  seasonNumber,
  ids,
  onClick,
}) => {
  const formattedAiringAt = format(new Date(airingAt), "h:mma");

  return (
    <div
      className="rounded-lg box-border w-full md:w-[395px] h-[292px] overflow-hidden flex flex-col items-start justify-start text-left text-2xs text-floralwhite-100 font-text-sm-font-normal border-[2px] border-solid border-floralwhite-200 cursor-pointer hover:border-floralwhite-100/50 transition-colors duration-300 ease-in-out"
      onClick={onClick}
    >
      <div className="relative h-[138px] w-full">
        <div className="absolute top-0 left-0 w-full h-full bg-[#000000]/50 z-[1]"></div>
        <Image
          className="absolute object-cover z-[10] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          alt={`${title} logo`}
          src={itemLogo}
          height={60}
          width={100}
          loading="lazy"
        />
        <div
          className="absolute h-full w-full flex flex-col items-center justify-center bg-cover bg-no-repeat bg-center top-0 left-0 z-0"
          style={{
            backgroundImage: `url("${itemBackdrop}")`,
          }}
        ></div>
      </div>
      <div className="self-stretch flex-1 flex flex-col items-center justify-center py-2.5 px-5">
        <div className="self-stretch flex flex-col items-start justify-end gap-[14px]">
          <div className="flex flex-row items-end justify-start gap-[5px]">
            <div className="rounded-sm bg-zinc-700 flex flex-row items-start justify-start py-[3px] px-1">
              <Suspense
                fallback={
                  <div className="relative font-semibold">Loading...</div>
                }
              >
                <time
                  className="relative font-semibold"
                  suppressHydrationWarning
                >
                  {formattedAiringAt}
                </time>
              </Suspense>
            </div>
            <div className="rounded-sm bg-zinc-800 flex flex-row items-start justify-start py-[3px] px-1">
              <div className="relative font-semibold">{pillInfo}</div>
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-end gap-[5px] text-base">
            <b className="self-stretch relative leading-[24px]">{title}</b>
            <div className="self-stretch relative text-sm leading-[20px]">
              {subtitle} S{seasonNumber?.toString().padStart(2, "0")}E
              {episodeNumber?.toString().padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PreviewItem;
