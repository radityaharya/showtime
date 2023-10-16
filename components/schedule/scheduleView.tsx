"use client";
import InfiniteScroll from "react-infinite-scroll-component";
import { ShowData } from "../../app/types/schedule";
import { MovieData } from "../../app/types/schedule";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { Axios } from "axios";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useContext } from "react";
import { AppContext } from "../provider";
import { contextType } from "../provider";
// interface Props {
//   Items: ShowData[] | MovieData[]
// }

type Items = ShowData[] | MovieData[];

const ScheduleView: React.FC = () => {
  const path = usePathname();
  const uid = path.split("/")[1];

  const { state, setState } = useContext(AppContext) as contextType;

  const [Items, setItems] = useState([] as Items);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [isDataLoading, setIsDataLoading] = useState(true);

  const debouncedFetch = useRef(
    debounce((url: string) => {
      setIsDataLoading(true);
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          setItems(data as Items);
          setIsDataLoading(false);
        });
    }, 500),
  ).current;

  useEffect(() => {
    debouncedFetch(`/api/user/${uid}/calendar/${state.calendar.type}`);
  });

  return (
    <div className="relative pb-5 pt-16 px-2 md:px-20 bg-black w-full overflow-hidden flex flex-col text-left text-sm text-gray-100 font-text-2xl-font-semibold gap-10">
      {Items.length > 0 ? (
        Items.map((item) => <ScheduleItems key={item.dateUnix} Shows={item} />)
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

function debounce(func: Function, wait: number) {
  let timeout: ReturnType<typeof setTimeout>;

  return function (...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export default ScheduleView;
