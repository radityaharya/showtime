"use client";
import { ShowData } from "../../app/types/schedule";
import { MovieData } from "../../app/types/schedule";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useContext } from "react";
import { AppContext, type contextType } from "../provider";
import { RangeDatePicker } from "./datePicker";
import LazyLoad from "react-lazy-load";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

interface Props {
  initItems: ShowData[] | MovieData[];
}

type Items = ShowData[] | MovieData[];

const ScheduleView: React.FC<Props> = ({ initItems }) => {
  const path = usePathname();
  const uid = path.split("/")[1];

  const { state, setState } = useContext(AppContext) as contextType;

  const [Items, setItems] = useState(initItems as Items);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [isDataLoading, setIsDataLoading] = useState(true);

  // format: YYYY-MM-DD
  // const [dateStart, setDateStart] = useState(dayjs().subtract(2, "day").format("YYYY-MM-DD"));
  // const [dateEnd, setDateEnd] = useState(dayjs().add(90, "day").format("YYYY-MM-DD"));

  const debouncedFetch = useRef(
    debounce((url: string) => {
      setIsDataLoading(true);

      // Check if data is stored in local storage
      const cachedData = localStorage.getItem(url);
      if (cachedData) {
        setItems(JSON.parse(cachedData));
        setIsDataLoading(false);
        return;
      }

      // Fetch data if not found in local storage
      fetch(url)
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setItems(data.data as Items);
          setIsDataLoading(false);

          // Store data in local storage
          localStorage.setItem(url, JSON.stringify(data.data));
        });
    }, 500),
  ).current;

  useEffect(() => {
    debouncedFetch(
      `/api/user/${uid}/calendar/${state.calendar.type}?dateStart=${dayjs(
        state.calendar.dateRange.from,
      ).format("YYYY-MM-DD")}&dateEnd=${dayjs(
        state.calendar.dateRange.to,
      ).format("YYYY-MM-DD")}`,
    );
  }, [
    debouncedFetch,
    state.calendar.type,
    uid,
    state.calendar.dateRange.from,
    state.calendar.dateRange.to,
  ]);

  function handleTypeToggle() {
    const newType = state.calendar.type === "shows" ? "movies" : "shows";
    setItems([]);
    setState((prevState) => ({
      ...prevState,
      calendar: {
        ...prevState.calendar,
        type: newType,
      },
    }));
  }

  return (
    <div>
      <div className="pb-4 text-white">
        <button onClick={handleTypeToggle} className="px-4 py-2">
          toggle type
        </button>
      </div>
      <RangeDatePicker />
      {Items.length > 0 ? (
        Items.map((item) => (
          <LazyLoad key={item.dateUnix} height={432} offset={300}>
            <ScheduleItems key={item.dateUnix} Shows={item} />
          </LazyLoad>
        ))
      ) : (
        <p className="text-white">Loading...</p>
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
