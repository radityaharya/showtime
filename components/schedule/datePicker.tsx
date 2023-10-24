/* eslint-disable no-undef */
"use client";

import { addDays } from "date-fns";
import { ArrowRight, Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useContext, useEffect } from "react";
import { AppContext, type AppContextValue } from "../provider";
import { DateRange } from "react-day-picker";
import dayjs from "dayjs";

export function RangeDatePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { state, setState } = useContext(AppContext) as AppContextValue;

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: state.calendar.dateRange.from,
    to: state.calendar.dateRange.to,
  });

  useEffect(() => {
    setState((prevState) => ({
      ...prevState,
      calendar: {
        ...prevState.calendar,
        dateRange: {
          from: dateRange?.from || prevState.calendar.dateRange.from,
          to: dateRange?.to || prevState.calendar.dateRange.to,
        },
      },
    }));
  }, [dateRange, setState]);

  return (
    <div className="flex flex-row gap-2 align-middle">
      <Popover data-side="bottom">
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[150px] md:w-[280px]  justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange ? dayjs(dateRange.from).format("MMM D, YYYY") : "From"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
          <Select
            onValueChange={(value) =>
              setDateRange((prev) => ({
                ...prev,
                from: addDays(new Date(), parseInt(value)),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="0">Today</SelectItem>
              <SelectItem value="1">Tomorrow</SelectItem>
              <SelectItem value="3">In 3 days</SelectItem>
              <SelectItem value="7">In a week</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
              mode="single"
              selected={dateRange?.from}
              onSelect={(date) =>
                setDateRange((prev) => ({ ...prev, from: date }))
              }
              defaultMonth={dateRange?.from}
            />
          </div>
        </PopoverContent>
      </Popover>
      <ArrowRight className="h-full my-auto w-4" />
      <Popover data-side="bottom">
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-[150px] md:w-[280px]  justify-start text-left font-normal",
              !dateRange && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange ? dayjs(dateRange.to).format("MMM D, YYYY") : "To"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-auto flex-col space-y-2 p-2">
          <Select
            onValueChange={(value) =>
              setDateRange(
                (prev) =>
                  ({
                    ...prev,
                    to: addDays(new Date(), parseInt(value)),
                  }) as DateRange,
              )
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="0">Today</SelectItem>
              <SelectItem value="1">Tomorrow</SelectItem>
              <SelectItem value="3">In 3 days</SelectItem>
              <SelectItem value="7">In a week</SelectItem>
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <Calendar
              mode="single"
              selected={dateRange?.to}
              onSelect={(date) =>
                setDateRange(
                  (prev) => ({ ...prev, to: date }) as DateRange | undefined,
                )
              }
              defaultMonth={dateRange?.to}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
