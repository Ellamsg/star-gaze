"use client";

import { useEffect, useRef, useState } from "react";
import type { NailDesign } from "@/lib/nail-design";
import type { NailStudio } from "@/components/nail-3d/studio";

type Props = {
  design: NailDesign;
  autoRotate?: boolean;
  className?: string;
};

/**
 * Mounts the WebGL studio on a canvas and keeps it in sync with the design.
 * three.js is imported on the client only, so nothing ships in the server
 * render and there is no SSR cost.
 */
export function NailStudioCanvas({
  design,
  autoRotate = true,
  className = "",
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const studioRef = useRef<NailStudio | null>(null);
  // Captured once for the first build; later changes flow through the effect
  // below, so the design never has to be read from a ref during render.
  const firstDesign = useRef(design);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );

  useEffect(() => {
    let cancelled = false;
    let studio: NailStudio | null = null;

    async function boot() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        const studioModule = await import("@/components/nail-3d/studio");
        if (cancelled) return;
        studio = studioModule.createNailStudio(canvas, firstDesign.current);
        if (cancelled) {
          studio.dispose();
          return;
        }
        studioRef.current = studio;
        setStatus("ready");
      } catch (error) {
        console.error("Failed to start the 3D studio", error);
        if (!cancelled) setStatus("error");
      }
    }

    void boot();

    return () => {
      cancelled = true;
      studioRef.current = null;
      studio?.dispose();
    };
  }, []);

  useEffect(() => {
    if (status === "ready") studioRef.current?.setDesign(design);
  }, [design, status]);

  useEffect(() => {
    if (status === "ready") studioRef.current?.setAutoRotate(autoRotate);
  }, [autoRotate, status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => studioRef.current?.resize());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full touch-none"
        aria-label="Interactive 3D preview of the selected nail design. Drag to rotate."
        role="img"
      />

      {status !== "ready" ? (
        <p className="absolute inset-0 flex items-center justify-center text-[12px] uppercase tracking-[0.2em] text-ink/40">
          {status === "loading" ? "Building the set…" : "3D unavailable"}
        </p>
      ) : null}
    </div>
  );
}
