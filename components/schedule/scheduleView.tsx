"use client";

import { MovieData, ShowData } from "../../app/types/schedule";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { usePathname } from "next/navigation";
import { useContext, FC, useState, useEffect } from "react";
import { AppContext, type AppContextValue } from "../provider";
import { RangeDatePicker } from "./datePicker";
import { TypeSwitcher } from "./typeSwitcher";
import { AddToCalendar } from "./addToCalendar";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Oval } from "react-loader-spinner";
import useSWR from "swr";

dayjs.extend(utc);

interface Props {
  initItems: ShowData[] | MovieData[];
}

// type Items = ShowData[] | MovieData[];

const fetcher = (url: string) =>
  fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch");
      }
      return response.json().then((data) => {
        return data.data;
      });
    })
    .catch((err) => console.log(err));

const ScheduleView: FC<Props> = ({ initItems }) => {
  const path = usePathname();
  const uid = path.split("/")[1];
  const { state } = useContext(AppContext) as AppContextValue;

  const [debouncedState, setDebouncedState] = useState(state);

  useEffect(() => {
    const debounced = debounce(() => {
      setDebouncedState(state);
    }, 1000);

    debounced();
  }, [state]);

  const { data, error, isValidating, isLoading } = useSWR(
    `/api/user/${uid}/calendar/${state.calendar.type}?dateStart=${dayjs(
      debouncedState.calendar.dateRange.from,
    ).format("YYYY-MM-DD")}&dateEnd=${dayjs(
      debouncedState.calendar.dateRange.to,
    ).format("YYYY-MM-DD")}`,
    fetcher,
    {
      fallbackData: initItems,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 5 * 60 * 1000,
      keepPreviousData: true,
    },
  );

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div className="px-4 md:px-0">
      <div className="flex flex-row items-center gap-3 mb-8">
        <h2 className="text-4xl font-semibold ">Schedule</h2>
        <TypeSwitcher />
        {isLoading || isValidating ? (
          <Oval
            height={20}
            width={20}
            color="#ffffff"
            wrapperStyle={{}}
            wrapperClass=""
            visible={true}
            ariaLabel="oval-loading"
            secondaryColor="#f0f0f0"
            strokeWidth={5}
            strokeWidthSecondary={5}
          />
        ) : null}
      </div>
      <div className="flex flex-row gap-2 mb-8 flex-wrap">
        <RangeDatePicker />
        <AddToCalendar />
      </div>
      <main className="flex flex-col gap-4">
        {data.length > 0 ? (
          data.map((item: any) => (
            <div key={item.dateUnix}>
              <ScheduleItems Shows={item} />
            </div>
          ))
        ) : !isLoading && !isValidating ? (
          <p className="text-white">
            No upcoming items returned within time range. Make sure there are
            entries in your trakt account.
          </p>
        ) : (
          <p className="text-white">Loading...</p>
        )}
      </main>
    </div>
  );
};

const debounce = (func: Function, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  };
};
export default ScheduleView;
