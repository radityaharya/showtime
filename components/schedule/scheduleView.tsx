"use client";

import { MovieData, ShowData } from "../../app/types/schedule";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { usePathname } from "next/navigation";
import { useState, useEffect, useContext, useCallback, FC } from "react";
import { AppContext, type AppContextValue } from "../provider";
import { RangeDatePicker } from "./datePicker";
import { TypeSwitcher } from "./typeSwitcher";
import { AddToCalendar } from "./addToCalendar";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Oval } from "react-loader-spinner";
dayjs.extend(utc);

interface Props {
  initItems: ShowData[] | MovieData[];
}

type Items = ShowData[] | MovieData[];

const ScheduleView: FC<Props> = ({ initItems }) => {
  const path = usePathname();
  const uid = path.split("/")[1];
  const { state } = useContext(AppContext) as AppContextValue;

  const [Items, setItems] = useState(initItems as Items);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(
    debounce((url: string) => {
      setIsDataLoading(true);

      const cachedData = localStorage.getItem(url);
      if (cachedData && Date.now() - JSON.parse(cachedData).date < 36000000) {
        const data = JSON.parse(cachedData);
        setItems(data.data as Items);
        setIsDataLoading(false);
        return;
      }

      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setItems(data.data as Items);
          setIsDataLoading(false);
        });
    }, 500),
    [],
  );

  useEffect(() => {
    debouncedFetch(
      `/api/user/${uid}/calendar/${state.calendar.type}?dateStart=${dayjs(
        state.calendar.dateRange.from,
      ).format("YYYY-MM-DD")}&dateEnd=${dayjs(
        state.calendar.dateRange.to,
      ).format("YYYY-MM-DD")}`,
    );
  }, [debouncedFetch, state.calendar.type, uid, state.calendar.dateRange]);

  return (
    <div className="px-4 md:px-0">
      <div className="flex flex-row items-center gap-3 mb-8">
        <h2 className="text-4xl font-semibold ">Schedule</h2>
        <TypeSwitcher />
        {isDataLoading && (
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
        )}
      </div>
      <div className="flex flex-row gap-2 mb-8 flex-wrap">
        <RangeDatePicker />
        <AddToCalendar />
      </div>
      <main className="flex flex-col gap-4">
        {Items.length > 0 ? (
          Items.map((item) => (
            <div key={item.dateUnix}>
              <ScheduleItems Shows={item} />
            </div>
          ))
        ) : (
          <p className="text-white">Loading...</p>
        )}
      </main>
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