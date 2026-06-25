"use client";

import { useEffect, useRef, useState } from "react";

type WakeLockSentinelLike = { release: () => Promise<void> };
type WakeLockNavigator = Navigator & {
  wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
};

export function useWakeLock(active: boolean): { isActive: boolean } {
  const sentinel = useRef<WakeLockSentinelLike | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const nav = typeof navigator !== "undefined" ? (navigator as WakeLockNavigator) : null;
    if (!nav?.wakeLock) return;

    let cancelled = false;

    const acquire = async () => {
      if (!active || document.visibilityState !== "visible") return;
      try {
        sentinel.current = await nav.wakeLock!.request("screen");
        if (!cancelled) setIsActive(true);
      } catch {
        setIsActive(false);
      }
    };

    const release = async () => {
      try {
        await sentinel.current?.release();
      } catch {
        /* ignore */
      }
      sentinel.current = null;
      setIsActive(false);
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    if (active) {
      void acquire();
      document.addEventListener("visibilitychange", onVisibility);
    } else {
      void release();
    }

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void release();
    };
  }, [active]);

  return { isActive };
}
