"use client";

import { useCallback, useEffect, useState } from "react";

const LS_KEY = "sentiment-book-intro-seen";
const VIDEO_SRC = "/demo/investor-pitch.mp4";

export function IntroPitchModal() {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        if (window.localStorage.getItem(LS_KEY) === "1") return;
      } catch {
        /* private mode */
      }
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(LS_KEY, "1");
    } catch {
      /* ignore */
    }
    setPlaying(false);
    setOpen(false);
  }, []);

  const watch = useCallback(() => setPlaying(true), []);
  const replay = useCallback(() => {
    setOpen(true);
    setPlaying(true);
  }, []);

  useEffect(() => {
    const onReplay = () => replay();
    window.addEventListener("sb:watch-intro", onReplay);
    return () => window.removeEventListener("sb:watch-intro", onReplay);
  }, [replay]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sb-intro-title"
      data-qa="intro-pitch-modal"
    >
      <div className="w-full max-w-lg border border-[#111827] bg-[#FAF7F2] p-5 shadow-lg">
        {!playing ? (
          <>
            <p className="text-[11px] font-semibold tracking-[0.16em] text-[#6B7280] uppercase">
              Sentiment Book
            </p>
            <h2 id="sb-intro-title" className="font-serif mt-2 text-[1.75rem] leading-tight font-semibold tracking-[-0.02em] text-[#111827]">
              Want a ~35s product intro?
            </h2>
            <p className="mt-3 text-[13px] leading-relaxed text-[#6B7280]">
              News → financial lexicon baseline → constrained 14-asset book → walk-forward backtest.
              Research desk only — LIVE trading stays off.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                data-qa="intro-watch"
                onClick={watch}
                className="bg-[#0F766E] px-3 py-2 text-[12px] font-semibold tracking-[0.08em] text-white uppercase"
              >
                Watch intro
              </button>
              <button
                type="button"
                data-qa="intro-skip"
                onClick={dismiss}
                className="border border-[#111827] bg-transparent px-3 py-2 text-[12px] font-semibold tracking-[0.08em] text-[#111827] uppercase"
              >
                Skip to app
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <h2 id="sb-intro-title" className="font-serif text-[1.35rem] font-semibold text-[#111827]">
                Sentiment Book intro
              </h2>
              <button
                type="button"
                data-qa="intro-dismiss"
                onClick={dismiss}
                className="text-[12px] tracking-[0.08em] text-[#6B7280] uppercase hover:text-[#111827]"
              >
                Continue
              </button>
            </div>
            <video
              className="mt-3 w-full border border-[#111827] bg-[#111827]"
              src={VIDEO_SRC}
              controls
              autoPlay
              playsInline
              onEnded={dismiss}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function watchIntroPitch() {
  window.dispatchEvent(new Event("sb:watch-intro"));
}
