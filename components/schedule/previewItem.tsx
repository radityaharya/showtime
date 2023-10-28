import Image from "next/image";
import { format } from "date-fns";
import LazyLoad from "react-lazy-load";
import { useEffect, useState, Suspense, useContext } from "react";
import { AppContext, type AppContextValue } from "../provider";
import { AddToHistory } from "./addToHistory";

export interface ItemType {
  itemLogo: string;
  itemBackdrop: string;
  airingAt: number;
  pillInfo: string;
  title: string;
  episodeNumber?: string;
  subtitle?: string;
  seasonNumber?: string;
  episodeIds?: any;
  ids?: any;
  watched?: any;
}
interface PreviewItemType {
  item: ItemType;
  onClick?: () => void;
}

// eslint-disable-next-line no-undef
export const PreviewItem: React.FC<PreviewItemType> = ({ item, onClick }) => {
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
        data: item,
      },
    });
  }

  return (
    <>
      {isClient ? (
        <LazyLoad height={320} offset={300} className="w-full md:w-[395px]">
          <PreviewItemContent item={item} onClick={handleModal} />
        </LazyLoad>
      ) : (
        <PreviewItemContent item={item} onClick={handleModal} />
      )}
    </>
  );
};

// eslint-disable-next-line no-undef
const PreviewItemContent: React.FC<PreviewItemType> = ({ item, onClick }) => {
  const formattedAiringAt = format(new Date(item.airingAt), "h:mma");

  return (
    <div className="rounded-lg box-border w-full md:w-[395px] h-[320px] overflow-hidden flex flex-col items-start justify-start text-left text-2xs text-floralwhite-100 font-text-sm-font-normal border-[2px] border-solid border-floralwhite-200 cursor-pointer hover:border-floralwhite-100/50 transition-colors duration-300 ease-in-out">
      <div
        onClick={onClick}
        className="self-stretch gap-0 w-full md:w-[395px] h-[320px]"
      >
        <div className="relative h-[138px] w-full">
          <div className="absolute top-0 left-0 w-full h-full bg-[#000000]/50 z-[1]"></div>
          <Image
            className="absolute object-cover z-[10] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            alt={`${item.title} logo`}
            src={item.itemLogo}
            height={60}
            width={100}
            loading="lazy"
          />
          <div
            className="absolute h-full w-full flex flex-col items-center justify-center bg-cover bg-no-repeat bg-center top-0 left-0 z-0"
            style={{
              backgroundImage: `url("${item.itemBackdrop}")`,
            }}
          ></div>
        </div>
        <div className="self-stretch flex-1 flex flex-col items-center justify-center py-3 px-5">
          <div className="self-stretch flex flex-col items-start justify-center h-full gap-[14px]">
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
                <div className="relative font-semibold">{item.pillInfo}</div>
              </div>
            </div>
            <div className="self-stretch flex flex-col items-start justify-end gap-[5px] text-base">
              <b className="self-stretch relative leading-[24px]">
                {item.title}
              </b>
              <div className="self-stretch relative text-sm leading-[20px]">
                {item.subtitle} S
                {item.seasonNumber?.toString().padStart(2, "0")}E
                {item.episodeNumber?.toString().padStart(2, "0")}
              </div>
            </div>
          </div>
        </div>
      </div>
      {item.episodeNumber && item.episodeNumber !== "N/A" ? (
        <AddToHistory item={item} className="z-10" />
      ) : (
        ""
      )}
    </div>
  );
};
export default PreviewItem;
