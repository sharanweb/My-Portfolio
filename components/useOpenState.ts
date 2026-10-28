"use client";
import { useEffect, useState } from "react";

/** Mirrors the reference open/close dance: unhide, then add .open next frame; remove .open, then hide after the transition. */
export function useOpenState(open: boolean, hideDelay: number) {
  const [hidden, setHidden] = useState(!open);
  const [cls, setCls] = useState(false);
  useEffect(() => {
    if (open) {
      setHidden(false);
      const r = requestAnimationFrame(() => requestAnimationFrame(() => setCls(true)));
      return () => cancelAnimationFrame(r);
    }
    setCls(false);
    const t = setTimeout(() => setHidden(true), hideDelay);
    return () => clearTimeout(t);
  }, [open, hideDelay]);
  return { hidden, open: cls };
}
