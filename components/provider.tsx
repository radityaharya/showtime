"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useState, Dispatch, SetStateAction } from "react";
import dayjs from "dayjs";
import { ItemModalProvider } from "./schedule/itemModal";
import { Toaster } from "@/components/ui/toaster";

type CalendarType = "shows" | "movies";

type AppProviderProps = {
  // eslint-disable-next-line no-undef
  children: React.ReactNode;
};

type CalendarDateRange = {
  from: Date;
  to: Date;
};

type AppContextState = {
  calendar: {
    type: CalendarType;
    dateRange: CalendarDateRange;
  };
  user: {
    uid: string | null;
    name: string | null;
    picture: string | null;
  };
  itemModal: {
    show: boolean;
    data: null | any;
  };
};

export type AppContextValue = {
  state: AppContextState;
  setState: Dispatch<SetStateAction<AppContextState>>;
};

const initialState: AppContextState = {
  calendar: {
    type: "shows",
    dateRange: {
      from: dayjs().subtract(2, "day").toDate(),
      to: dayjs().add(30, "day").toDate(),
    },
  },
  user: {
    uid: null,
    name: null,
    picture: null,
  },
  itemModal: {
    show: false,
    data: null,
  },
};

export const AppContext = createContext<AppContextValue>({
  state: initialState,
  setState: () => {},
});

// eslint-disable-next-line no-undef
export const Providers: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppContextState>(initialState);

  return (
    <SessionProvider>
      <AppContext.Provider value={{ state, setState }}>
        <ItemModalProvider>
          {children}
          <Toaster />
        </ItemModalProvider>
      </AppContext.Provider>
    </SessionProvider>
  );
};
