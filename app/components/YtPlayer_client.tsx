"use client";
import YouTube, { YouTubeProps } from "react-youtube";
import { useState, useEffect } from "react";

interface Props {
  videoId?: string;
  className?: string;
}

export const YoutubePlayer: React.FC<Props> = ({ videoId, ...Props }) => {
  const [hidden, setHidden] = useState(true);
  const [clientSize, setClientSize] = useState({ width: 0, height: 0 });

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
    setTimeout(() => {
      setHidden(false);
    }, 6000);
  };

  const onEnd = (event: any) => {
    event.target.playVideo();
  };

  return (
    <div className="absolute top-0 left-0 max-w-screen max-h-screen w-full h-full bg-black/20 overflow-hidden">
      <div
        className={`absolute top-0 left-0 w-full h-full opacity-50 ${
          hidden ? "opacity-0" : "opacity-100"
        } transition-opacity duration-1000 ease-in-out`}
      />
      <YouTube
        videoId={videoId ?? "4IlF715Yn00"}
        opts={opts}
        onReady={onReady}
        onEnd={onEnd}
        className={`absolute z-0 top-0 left-0 w-full h-full overflow-hidden transform ${
          hidden ? "opacity-0" : "opacity-100"
        } transition-opacity duration-1000 ease-in-out ${
          hidden ? "scale-100" : "scale-110"
        } transition-transform duration-1000 ease-in-out ${Props.className}`}
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
};
