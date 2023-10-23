"use client";
import { usePathname } from "next/navigation";
import { AppContext, type AppContextValue } from "../provider";
import { useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export const AddToCalendar: React.FC = () => {
  const { state, setState } = useContext(AppContext) as AppContextValue;

  const [host, setHost] = useState("");
  const user = usePathname().split("/")[1];

  useEffect(() => {
    setHost(`${window.location.protocol}//${window.location.host}`);
  }, []);

  function addCalendarProtocol(
    protocol: "webcal" | "google" | "outlook365" | "outlooklive",
  ) {
    const calendarType = state.calendar.type;
    const webcal_url =
      `${host}/api/${user}/calendar/${calendarType}/ical`.replace(
        /^https?:/,
        "webcal:",
      );

    const urls = {
      webcal: webcal_url,
      google: `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
        webcal_url,
      )}`,
      outlook365: `https://outlook.office.com/owa?path=%2Fcalendar%2Faction%2Fcompose&rru=addsubscription&url=${encodeURIComponent(
        webcal_url,
      )}&name=Trakt%20iCal`,
      outlooklive: `https://outlook.live.com/owa?path=%2Fcalendar%2Faction%2Fcompose&rru=addsubscription&url=${encodeURIComponent(
        webcal_url,
      )}&name=Trakt%20iCal`,
    };

    return urls[protocol];
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Add to Calendar</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuItem>
          <Link href={addCalendarProtocol("webcal")} target="_blank">
            Apple Calendar/Webcal
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={addCalendarProtocol("google")} target="_blank">
            Google Calendar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={addCalendarProtocol("outlook365")} target="_blank">
            Outlook 365
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Link href={addCalendarProtocol("outlooklive")} target="_blank">
            Outlook Live
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
