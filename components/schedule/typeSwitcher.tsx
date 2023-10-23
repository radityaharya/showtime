"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContext } from "react";
import { AppContext, type AppContextValue } from "../provider";

export function TypeSwitcher() {
  const { state, setState } = useContext(AppContext) as AppContextValue;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {
            (state.calendar.type.charAt(0).toUpperCase() +
              state.calendar.type.slice(1)) as "shows" | "movies"
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Type</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={state.calendar.type as "shows" | "movies"}
          onValueChange={(value) =>
            setState({
              ...state,
              calendar: {
                ...state.calendar,
                type: value as "shows" | "movies",
              },
            })
          }
        >
          <DropdownMenuRadioItem value="shows">Shows</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="movies">Movies</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
