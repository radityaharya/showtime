import { format } from "date-fns";
import { Suspense, useContext, memo, FC } from "react";
import Image from "next/image";
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

export const PreviewItem: FC<PreviewItemType> = memo(function PreviewItem({
  item,
  onClick,
}) {
  const { state, setState } = useContext(AppContext) as AppContextValue;

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

  return <PreviewItemContent item={item} onClick={handleModal} />;
});

PreviewItem.displayName = "PreviewItem";

const PreviewItemContent: FC<PreviewItemType> = ({ item, onClick }) => {
  const formattedAiringAt = format(new Date(item.airingAt), "h:mma");

  return (
    <div className="group w-full rounded-lg text-floralwhite-100 font-text-sm-font-normal border-[2px] border-solid hover:cursor-pointer border-transparent hover:border-floralwhite-100/30 transition-colors duration-300 ease-in-out">
      <div onClick={onClick} className="flex flex-col w-full">
        <div className="relative w-full max-h-[50%] aspect-[3/1] overflow-hidden rounded-lg group-hover:rounded-b-none transition-all duration-300 ease-in-out">
          <Image
            className="absolute object-cover z-[10] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            alt={`${item.title} logo`}
            src={item.itemLogo}
            height={60}
            width={100}
            loading="lazy"
          />
          <div className="absolute top-0 left-0 w-full h-full z-0">
            <Image
              className="absolute object-cover w-full h-full filter blur-[1px] brightness-[0.5]"
              alt={`${item.title} backdrop`}
              src={item.itemBackdrop}
              fill
              loading="lazy"
            />
          </div>
        </div>
        <div className="flex-grow flex flex-col justify-between box-border gap-2 text-left font-medium">
          <div className="flex flex-col gap-4 px-2 py-4 md:min-h-[150px]">
            <div className="flex items-center gap-[0.31rem]">
              <div className="rounded-sm bg-zinc-700 flex items-center justify-center py-[0.19rem] px-[0.25rem]">
                <Suspense fallback={<div className="relative">Loading...</div>}>
                  <time
                    className="relative font-semibold"
                    suppressHydrationWarning
                  >
                    {formattedAiringAt}
                  </time>
                </Suspense>
              </div>
              <div className="rounded-sm bg-zinc-800 flex items-center justify-center py-[0.19rem] px-[0.25rem]">
                <div className="relative font-semibold">{item.pillInfo}</div>
              </div>
            </div>
            <div className="flex flex-col gap-2 text-base">
              <b className="relative overflow-hidden text-ellipsis whitespace-nowrap">
                {item.title}
              </b>
              <div className="relative text-sm">
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
