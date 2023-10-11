import Image from "next/image";

interface PreviewItemType {
  itemLogo: string;
  itemBackdrop: string;
  airingAt: string;
  network: string;
  episodeName: string;
  episodeNumber: string;
  seriesName: string;
  seasonNumber: string;
}

export const PreviewItem: React.FC<PreviewItemType> = ({
  itemLogo,
  itemBackdrop,
  airingAt,
  network,
  episodeName,
  episodeNumber,
  seriesName,
  seasonNumber,
}) => {
  return (
    <div className="rounded-lg box-border w-[395px] h-[292px] overflow-hidden flex flex-col items-start justify-start text-left text-2xs text-floralwhite-100 font-text-sm-font-normal border-[2px] border-solid border-floralwhite-200">
      <div className="relative h-[138px] w-full">
        <div className="absolute top-0 left-0 w-full h-full bg-[#000000]/50 z-[1]"></div>
        <Image
          className="absolute object-cover z-[10] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          alt=""
          src={itemLogo}
          height={40}
          width={100}
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
              <div className="relative font-semibold">{airingAt}</div>
            </div>
            <div className="rounded-sm bg-zinc-800 flex flex-row items-start justify-start py-[3px] px-1">
              <div className="relative font-semibold">{network}</div>
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-end gap-[5px] text-base">
            <b className="self-stretch relative leading-[24px]">
              {episodeName}
            </b>
            <div className="self-stretch relative text-sm leading-[20px]">
              {seriesName} S{seasonNumber.toString().padStart(2, "0")}E
              {episodeNumber.toString().padStart(2, "0")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewItem;
