import { useState, FC } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import type { ItemType } from "./previewItem";
import { usePathname } from "next/navigation";
import { useSWRConfig } from "swr";
type Props = {
  className?: string;
  item: ItemType;
};

export const AddToHistory: FC<Props> = ({ item, className }: Props) => {
  const { mutate } = useSWRConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [watched, setWatched] = useState(item.watched || false);
  const { toast } = useToast();
  const path = usePathname();
  const uid = path.split("/")[1];
  const user = uid === "me" ? "me" : uid;

  async function updateHistory(action: "add" | "remove") {
    setIsLoading(true);

    if (action === "add") {
      const body = {
        movies: [],
        episodes: [
          {
            watched_at: new Date().toISOString(),
            ids: {
              trakt: item.episodeIds.trakt,
            },
          },
        ],
      };
      const response = await fetch(`/api/user/${user}/trakt/sync/history`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        setWatched(true);
        console.log("watched", watched);
      }
      console.log(data);
    } else {
      const body = {
        movies: [],
        episodes: [
          {
            ids: {
              trakt: item.episodeIds.trakt,
            },
          },
        ],
      };
      const response = await fetch(
        `/api/user/${user}/trakt/sync/history/remove`,
        {
          method: "POST",
          body: JSON.stringify(body),
        },
      );
      const data = await response.json();
      if (response.ok) {
        setWatched(false);
        console.log("watched", watched);
      }
      console.log(data);
    }

    const title =
      action === "add" ? "Added to history" : "Removed from history";
    const description =
      item.episodeNumber !== undefined && item.seasonNumber !== undefined
        ? `Added ${item.subtitle} S${item.seasonNumber
            .toString()
            .padStart(2, "0")}E${item.episodeNumber
            .toString()
            .padStart(2, "0")} ${action === "add" ? "to" : "from"} your history`
        : `Added ${item.subtitle} ${
            action === "add" ? "to" : "from"
          } your history`;

    setIsLoading(false);
    toast({ title, description });
    mutate(
      (key) => typeof key === "string" && key.startsWith("/api/user"),
      undefined,
      { revalidate: true },
    );
  }

  function clickHandler() {
    if (watched) {
      updateHistory("remove");
    } else {
      updateHistory("add");
    }
  }

  return (
    <button
      className={cn(
        "w-full flex justify-center items-center text-white font-bold py-3 px-4 rounded-lg rounded-t-none group-hover:rounded-t-lg hover:bg-white hover:text-black transition-all duration-300 ease-in-out bg-neutral-900",
        watched && "bg-white text-black",
        isLoading && "bg-gray cursor-not-allowed",
      )}
      onClick={clickHandler}
    >
      <Check size={20} />
      <span className="ml-2"></span>
    </button>
  );
};
