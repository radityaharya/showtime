"use client";

import { useEffect, useRef, useState, FC } from "react";

export const CountDownTimer: FC<{ airsAt: string }> = ({ airsAt }) => {
  const [timeLeft, setTimeLeft] = useState(
    new Date(airsAt).getTime() - new Date().getTime(),
  );
  const timeLeftRef = useRef(timeLeft);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(timeLeftRef.current - 1000);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="flex flex-row items-center justify-center w-full h-full">
      <div className="flex flex-row items-center justify-center gap-1">
        <div suppressHydrationWarning>
          {Math.floor(timeLeft / (1000 * 60 * 60 * 24))}d
        </div>
        <div suppressHydrationWarning>
          {Math.floor((timeLeft / (1000 * 60 * 60)) % 24)}h
        </div>
        <div suppressHydrationWarning>
          {Math.floor((timeLeft / 1000 / 60) % 60)}m
        </div>
        <div suppressHydrationWarning>
          {Math.floor((timeLeft / 1000) % 60)}s
        </div>
      </div>
    </div>
  );
};
