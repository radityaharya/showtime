"use client";
import YouTube, { YouTubeProps } from "react-youtube";
import { useState, useEffect, memo, FC } from "react";
import { useToast } from "@/components/ui/use-toast";

import Image from "next/image";
interface Props {
  videoId?: string;
  fallbackImg: string;
  className?: string;
}

export const YoutubePlayer: FC<Props> = memo(
  ({ videoId, fallbackImg, ...Props }) => {
    const [hidden, setHidden] = useState(true);
    const [clientSize, setClientSize] = useState({ width: 0, height: 0 });
    const [fallback, setFallback] = useState(true);
    const { toast } = useToast();
    console.log(videoId);
    useEffect(() => {
      const handleResize = () => {
        setClientSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      handleResize();

      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }, []);

    const opts: YouTubeProps["opts"] = {
      height: clientSize.height.toString(),
      width: clientSize.width.toString(),
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        mute: 1,
        controls: 0,
        loop: 1,
        iv_load_policy: 3,
      },
    };

    const onReady = (event: any) => {
      const state = event.target.getPlayerState();
      if (state === -1) {
        toast({
          title: "Whoops!",
          description: "This video is not available.",
        });
        setFallback(true);
      }
      setTimeout(() => {
        setHidden(false);
      }, 6000);
    };

    useEffect(() => {
      setTimeout(() => {
        if (videoId) {
          setFallback(false);
        } else {
          console.log("no video id");
          setFallback(true);
        }
      }, 2000);
    }, [videoId]);

    const onEnd = (event: any) => {
      event.target.playVideo();
    };

    return (
      <div className="absolute top-0 left-0 max-w-screen max-h-screen w-full h-full bg-black/20 overflow-hidden">
        {fallback ? (
          <Image
            src={fallbackImg.replace("w500", "original")}
            alt="Fallback image"
            className="absolute top-0 left-0 w-full h-full object-cover"
            fill
          />
        ) : (
          <>
            <div
              className={`absolute top-0 left-0 w-full h-full opacity-50 ${
                hidden ? "opacity-0" : "opacity-100"
              } transition-opacity duration-1000 ease-in-out`}
            />
            <YouTube
              videoId={videoId}
              opts={opts}
              onReady={onReady}
              onEnd={onEnd}
              // onError={onError}
              className={`absolute z-0 top-0 left-0 w-full h-full overflow-hidden transform ${
                hidden ? "opacity-0" : "opacity-100"
              } transition-opacity duration-1000 ease-in-out ${
                hidden ? "scale-100" : "scale-110"
              } transition-transform duration-1000 ease-in-out ${
                Props.className
              }`}
              style={{ pointerEvents: "none" }}
            />
          </>
        )}
      </div>
    );
  },
);

YoutubePlayer.displayName = "YoutubePlayer";
