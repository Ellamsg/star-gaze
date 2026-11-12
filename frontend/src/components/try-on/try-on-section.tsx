"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  designToQuery,
  describeDesign,
  type NailDesign,
} from "@/lib/nail-design";
import { DesignControls } from "@/components/nail-3d/design-controls";
import { NailStudioCanvas } from "@/components/nail-3d/nail-studio-canvas";
import type { ArStatus, ArTryOn } from "@/components/try-on/ar-try-on";

type Phase = "idle" | "starting" | ArStatus["state"];

export function TryOnSection({
  initialDesign,
}: {
  initialDesign: NailDesign;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<ArTryOn | null>(null);

  const [design, setDesign] = useState<NailDesign>(initialDesign);
  const [phase, setPhase] = useState<Phase>("idle");
  const [hands, setHands] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [snapshot, setSnapshot] = useState<string | null>(null);

  const stop = useCallback(() => {
    handleRef.current?.dispose();
    handleRef.current = null;
    setPhase("idle");
    setHands(0);
  }, []);

  // Tear the camera down when the user leaves the page.
  useEffect(() => stop, [stop]);

  const start = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setError(null);
    setPhase("starting");

    try {
      const arModule = await import("@/components/try-on/ar-try-on");
      const handle = await arModule.createArTryOn({
        video,
        canvas,
        design,
        onStatus: (status) => {
          setPhase(status.state);
          if (status.state === "running") setHands(status.hands);
          if (status.state === "error") setError(status.message);
        },
      });
      handleRef.current = handle;
    } catch (caught) {
      setPhase("error");
      setError(
        caught instanceof Error
          ? caught.message
          : "Something went wrong starting the camera."
      );
    }
  }, [design]);

  // Keep the overlay in sync with the designer.
  useEffect(() => {
    handleRef.current?.setDesign(design);
  }, [design]);

  // Match the stage to the camera's real aspect so nothing is cropped.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onMeta = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setAspect(video.videoWidth / video.videoHeight);
      }
    };
    video.addEventListener("loadedmetadata", onMeta);
    return () => video.removeEventListener("loadedmetadata", onMeta);
  }, []);

  /** Flatten the video frame and the nail overlay into one shareable image. */
  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.videoWidth === 0) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    const out = document.createElement("canvas");
    out.width = width;
    out.height = height;
    const ctx = out.getContext("2d");
    if (!ctx) return;

    // Mirror the camera frame to match what the user sees.
    ctx.save();
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, width, height);
    ctx.restore();

    // The overlay is already in mirrored coordinates.
    ctx.drawImage(canvas, 0, 0, width, height);

    setSnapshot(out.toDataURL("image/jpeg", 0.9));
  }

  const statusLabel: Record<Phase, string> = {
    idle: "Camera off",
    starting: "Starting…",
    "requesting-camera": "Waiting for permission…",
    "loading-model": "Loading hand tracking…",
    running: hands === 0 ? "Show your hand" : `${hands} hand${hands === 1 ? "" : "s"} tracked`,
    error: "Camera unavailable",
  };

  const live = phase === "running";

  const stageMessage = error
    ? error
    : phase === "loading-model"
      ? "Loading the hand-tracking model — takes a few seconds the first time."
      : phase === "starting" || phase === "requesting-camera"
        ? "Allow camera access when your browser asks."
        : "Turn the camera on and hold your hand up about 30cm away. Your nails appear on your fingertips — nothing is uploaded or recorded.";

  return (
    <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
      {/* --------------------------------- camera -------------------------------- */}
      <div className="flex flex-col gap-4">
        <div className="relative overflow-hidden rounded-[26px] border border-line bg-ink">
          <div className="relative w-full" style={{ aspectRatio: aspect }}>
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full -scale-x-100 object-cover"
              playsInline
              muted
            />
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            />

            {/* Status chip */}
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 rounded-full bg-ink/70 px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] text-paper backdrop-blur">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  live && hands > 0
                    ? "bg-emerald-400"
                    : live
                      ? "bg-amber-300"
                      : phase === "error"
                        ? "bg-red-400"
                        : "bg-paper/50"
                }`}
              />
              {statusLabel[phase]}
            </div>

            {/* Idle / error overlay */}
            {!live ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink/85 px-6 text-center">
                <p className="max-w-sm text-[14px] leading-relaxed text-paper/80">
                  {stageMessage}
                </p>
                <button
                  type="button"
                  onClick={start}
                  disabled={phase === "starting" || phase === "loading-model"}
                  className="rounded-full border border-paper/35 px-6 py-3 text-sm font-medium tracking-tight text-paper transition-colors hover:bg-paper hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {error ? "Try again" : phase === "idle" ? "Start camera" : "Working…"}
                </button>
                <p className="max-w-xs text-[12px] leading-relaxed text-paper/45">
                  Needs camera permission. On older browsers, or without a
                  webcam, the 3D preview below still works.
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={live ? stop : start}
            className="rounded-full border border-ink/20 px-4 py-2 text-[12px] tracking-tight transition-colors hover:border-ink/50"
          >
            {live ? "Stop camera" : "Start camera"}
          </button>
          <button
            type="button"
            onClick={capture}
            disabled={!live}
            className="rounded-full border border-ink/20 px-4 py-2 text-[12px] tracking-tight transition-colors hover:border-ink/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Capture look
          </button>
          <p className="text-[12px] text-ink/50">
            Bright, even light tracks best.
          </p>
        </div>

        {snapshot ? (
          <div className="flex items-start gap-4 rounded-[20px] border border-line bg-paper-dim/50 p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={snapshot}
              alt="Captured try-on showing the selected nails on your hand"
              className="h-24 w-auto rounded-[14px]"
            />
            <div className="text-[13px]">
              <p className="font-medium">Captured</p>
              <p className="mt-1 text-ink/60">
                Saved to this page only — nothing left your device.
              </p>
              <a
                href={snapshot}
                download="petal-lash-try-on.jpg"
                className="mt-2 inline-block underline underline-offset-4 hover:opacity-70"
              >
                Download image
              </a>
            </div>
          </div>
        ) : null}

        {/* Fallback so the feature still shows something without a camera. */}
        {phase === "error" ? (
          <div className="rounded-[26px] border border-line bg-[linear-gradient(180deg,#efe9e0_0%,#e4dbd0_100%)] p-3">
            <p className="px-2 pb-2 text-[11px] uppercase tracking-[0.22em] text-ink/45">
              3D preview instead
            </p>
            <NailStudioCanvas
              design={design}
              autoRotate
              className="h-[300px] w-full"
            />
          </div>
        ) : null}
      </div>

      {/* --------------------------------- designer ------------------------------ */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.22em] text-ink/50">
            Your look
          </p>
          <Link
            href={`/nails?${designToQuery(design)}`}
            className="text-[13px] text-ink/70 underline-offset-4 hover:underline"
          >
            Open in the 3D studio ↗
          </Link>
        </div>

        <p className="mt-3 font-display text-[20px] font-medium tracking-[-0.02em]">
          {describeDesign(design)}
        </p>

        <div className="mt-7">
          <DesignControls
            design={design}
            onChange={setDesign}
            presetsLimit={6}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-line pt-6">
          <Link
            href="/booking"
            className="rounded-full bg-ink px-6 py-3 text-sm font-medium tracking-tight text-paper transition-opacity hover:opacity-85"
          >
            Book this look →
          </Link>
          <Link
            href={`/nails?${designToQuery(design)}`}
            className="rounded-full border border-ink/25 px-6 py-3 text-sm font-medium tracking-tight transition-colors hover:bg-ink hover:text-paper"
          >
            Refine in 3D
          </Link>
        </div>
      </div>
    </div>
  );
}
