"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders its children only after the browser has taken over.
 *
 * The dashboard is full of client-only facts — today's date, localStorage,
 * the URL filter. Rendering it during the static prerender makes Next bail out
 * to a browser render, which moves the page outside the layout shell. Gating on
 * mount keeps the shell static and the screens client-only, which is what they
 * are anyway.
 */
export function Mounted({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: client-only content
    setMounted(true);
  }, []);

  return <>{mounted ? children : fallback}</>;
}
