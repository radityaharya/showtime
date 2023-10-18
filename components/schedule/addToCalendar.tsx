"use client";
import { usePathname } from "next/navigation";
import { AppContext, type contextType } from "../provider";
import { useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface Props {
  // Define component props here
}

export const AddToCalendar: React.FC<Props> = (
  {
    /* Destructure props here */
  },
) => {
  const { state, setState } = useContext(AppContext) as contextType;

  const [host, setHost] = useState("");
  const user = usePathname().split("/")[1];

  useEffect(() => {
    setHost(`${window.location.protocol}//${window.location.host}`);
  }, []);

  function addCalendarProtocol(
    protocol: "webcal" | "google" | "outlook365" | "outlooklive",
  ) {
    const calendarType = state.calendar.type;
    const webcal_url = `${host}/api/${user}/calendar/${calendarType}/ical`
      .replace("https://", "webcal://")
      .replace("http://", "webcal://");

    let addCalendarUrl = "";

    switch (protocol) {
      case "webcal":
        addCalendarUrl = webcal_url;
        break;
      case "google":
        addCalendarUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
          webcal_url,
        )}`;
        break;
      case "outlook365":
        addCalendarUrl = `https://outlook.office.com/owa?path=%2Fcalendar%2Faction%2Fcompose&rru=addsubscription&url=${encodeURIComponent(
          webcal_url,
        )}&name=Trakt%20iCal`;
        break;
      case "outlooklive":
        addCalendarUrl = `https://outlook.live.com/owa?path=%2Fcalendar%2Faction%2Fcompose&rru=addsubscription&url=${encodeURIComponent(
          webcal_url,
        )}&name=Trakt%20iCal`;
        break;
    }

    return addCalendarUrl;
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
