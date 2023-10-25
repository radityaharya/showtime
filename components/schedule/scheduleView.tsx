"use client";
import { MovieData, ShowData } from "../../app/types/schedule";
import ScheduleItems from "@/components/schedule/scheduleCard";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, useContext } from "react";
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

// eslint-disable-next-line no-undef
const ScheduleView: React.FC<Props> = ({ initItems }) => {
  const path = usePathname();
  const uid = path.split("/")[1];
  const [nextAuthSessionToken, setNextAuthSessionToken] = useState("");

  useEffect(() => {
    const nextAuthSessionToken = document.cookie.split("; ").find((row) => {
      return row.startsWith("__Secure-next-auth.session-token");
    }) as string;
    setNextAuthSessionToken(nextAuthSessionToken);
  }, []);

  console.log(nextAuthSessionToken);
  const { state } = useContext(AppContext) as AppContextValue;

  const [Items, setItems] = useState(initItems as Items);

  // const [page, setPage] = useState(1);

  // const [hasMore, setHasMore] = useState(true);

  const [isDataLoading, setIsDataLoading] = useState(true);

  const debouncedFetch = useRef(
    debounce((url: string) => {
      setIsDataLoading(true);

      const cachedData = localStorage.getItem(url);
      if (cachedData && Date.now() - JSON.parse(cachedData).date < 36000000) {
        const data = JSON.parse(cachedData);
        setItems(data.data as Items);
        setIsDataLoading(false);
        return;
      }

      // Fetch data if not found in local storage
      fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: nextAuthSessionToken
            ? nextAuthSessionToken.split("=")[1]
            : "",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data);
          setItems(data.data as Items);
          setIsDataLoading(false);

          // Store data in local storage
          localStorage.setItem(
            url,
            JSON.stringify({ data: data.data, date: Date.now() }),
          );
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
  }, [debouncedFetch, state.calendar.type, uid, state.calendar.dateRange]);

  // function handleTypeToggle() {
  //   const newType = state.calendar.type === "shows" ? "movies" : "shows";
  //   setItems([]);
  //   setState((prevState) => ({
  //     ...prevState,
  //     calendar: {
  //       ...prevState.calendar,
  //       type: newType,
  //     },
  //   }));
  // }

  // function handleTypeChange(el: HTMLElement) {
  //   const newType = el.getAttribute("data-type") as "shows" | "movies";
  //   setItems([]);
  //   setState((prevState) => ({
  //     ...prevState,
  //     calendar: {
  //       ...prevState.calendar,
  //       type: newType,
  //     },
  //   }));
  // }

  return (
    <div className="px-4 md:px-0">
      <div className="flex flex-row items-center gap-3 mb-8">
        <h2 className="text-4xl font-semibold ">Schedule</h2>
        <TypeSwitcher />
        {isDataLoading ? (
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
        ) : (
          ""
        )}
      </div>
      <div className="flex flex-row gap-2 mb-8 flex-wrap">
        <RangeDatePicker />
        <AddToCalendar />
      </div>
      <main className="flex flex-col gap-4">
        {Items.length > 0 ? (
          Items.map((item) => (
            <ScheduleItems key={item.dateUnix} Shows={item} />
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
