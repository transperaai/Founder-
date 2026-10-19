"use client";

import { PlayIcon } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

// Plays a moment as a time range of the call's recording: seek to the start,
// pause at the end. No video cutting.

type Range = { startS: number; endS: number };
const PlayerContext = createContext<((range: Range) => void) | null>(null);

export const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function MomentPlayer({ src, children }: { src: string | null; children: React.ReactNode }) {
  const video = useRef<HTMLVideoElement>(null);
  const [range, setRange] = useState<Range | null>(null);

  useEffect(() => {
    const el = video.current;
    if (!el || !range) return;
    const stopAtEnd = () => {
      if (el.currentTime >= range.endS) el.pause();
    };
    el.addEventListener("timeupdate", stopAtEnd);
    return () => el.removeEventListener("timeupdate", stopAtEnd);
  }, [range]);

  const play = (r: Range) => {
    const el = video.current;
    if (!el) return;
    setRange(r);
    el.currentTime = r.startS;
    void el.play().catch(() => {});
  };

  return (
    <PlayerContext.Provider value={src ? play : null}>
      {src && (
        <video ref={video} src={src} controls preload="metadata" className="aspect-video w-full max-w-xl rounded-lg bg-black" aria-label="Call recording" />
      )}
      {children}
    </PlayerContext.Provider>
  );
}

/** A moment's time; plays that range of the recording when there is one. */
export function PlayMoment({ startS, endS, label }: Range & { label?: string }) {
  const play = useContext(PlayerContext);
  const time = formatTime(startS);
  if (!play) return <span className="text-xs text-muted-foreground tabular-nums">{time}</span>;
  return (
    <Button size="xs" variant="outline" onClick={() => play({ startS, endS })} aria-label={`Play ${label ?? "moment"} at ${time}`}>
      <PlayIcon /> {time}
    </Button>
  );
}
