"use client";
import { SessionProvider } from "next-auth/react";
import { createContext, useContext, useState } from "react";
import { ShowData, MovieData } from "../app/types/schedule";

export type contextType = {
  state: {
    calendar: {
      type: "shows" | "movies";
      // data: ShowData[] | MovieData[] | null
    };
    user: {
      uid: string | null;
      name: string | null;
      picture: string | null;
    };
  };
  setState: React.Dispatch<
    React.SetStateAction<{
      calendar: {
        type: "shows" | "movies";
        // data: ShowData[] | MovieData[] | null;
      };
      user: {
        uid: string | null;
        name: string | null;
        picture: string | null;
      };
    }>
  >;
};
export const AppContext = createContext({} as contextType);
export function Providers({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({
    calendar: {
      type: "shows" as "shows" | "movies",
      // data: null as ShowData[] | MovieData[] | null
    },
    user: {
      uid: null as string | null,
      name: null as string | null,
      picture: null as string | null,
    },
  });

  return (
    <SessionProvider>
      <AppContext.Provider value={{ state, setState }}>
        {children}
      </AppContext.Provider>
    </SessionProvider>
  );
}
