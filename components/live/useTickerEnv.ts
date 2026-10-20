"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

const CLOCK_TICK_MS = 1_000;
const SHARE_FEEDBACK_MS = 2_000;

function subscribeClock(onChange: () => void): () => void {
  const timer = setInterval(onChange, CLOCK_TICK_MS);
  return () => clearInterval(timer);
}

const clockNow = (): number => Math.floor(Date.now() / CLOCK_TICK_MS) * CLOCK_TICK_MS;
const clockOnServer = (): null => null;

/** Current time in epoch ms, ticking once a second; `null` during SSR and hydration so markup never mismatches. */
export function useClock(): number | null {
  return useSyncExternalStore(subscribeClock, clockNow, clockOnServer);
}

const subscribeNever = (): (() => void) => () => {};

/** Browser capability that is false on the server and during hydration. */
function useCapability(detect: () => boolean): boolean {
  return useSyncExternalStore(subscribeNever, detect, () => false);
}

const detectWakeLock = (): boolean => "wakeLock" in navigator;

/** Screen Wake Lock toggle; the lock is re-acquired when the tab becomes visible again. */
export function useWakeLock(): { supported: boolean; active: boolean; toggle: () => void } {
  const supported = useCapability(detectWakeLock);
  const [active, setActive] = useState(false);
  const sentinel = useRef<WakeLockSentinel | null>(null);

  const acquire = useCallback(async (): Promise<boolean> => {
    try {
      sentinel.current = await navigator.wakeLock.request("screen");
      return true;
    } catch {
      return false; // denied (e.g. battery saver) — the toggle simply stays off
    }
  }, []);

  const release = useCallback(() => {
    void sentinel.current?.release();
    sentinel.current = null;
  }, []);

  const toggle = useCallback(() => {
    if (active) {
      release();
      setActive(false);
      return;
    }
    void acquire().then(setActive);
  }, [active, acquire, release]);

  useEffect(() => {
    if (!active) return;
    // The browser drops the lock whenever the tab is hidden.
    const onVisibility = () => {
      if (!document.hidden) void acquire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [active, acquire]);

  useEffect(() => release, [release]);

  return { supported, active, toggle };
}

/** Native share sheet when available, otherwise copies the text to the clipboard. */
export function useShare(): { share: (title: string, text: string) => void; copied: boolean } {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const share = useCallback((title: string, text: string) => {
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      navigator.share({ title, text, url }).catch(() => {}); // dismissing the sheet rejects
      return;
    }
    navigator.clipboard
      .writeText(`${text} ${url}`)
      .then(() => {
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), SHARE_FEEDBACK_MS);
      })
      .catch(() => {});
  }, []);

  return { share, copied };
}

/** Counter that increments whenever `value` changes after the first render (0 = never changed). */
export function useChangeCount(value: number): number {
  const [previous, setPrevious] = useState(value);
  const [count, setCount] = useState(0);
  if (previous !== value) {
    setPrevious(value);
    setCount(count + 1);
  }
  return count;
}
