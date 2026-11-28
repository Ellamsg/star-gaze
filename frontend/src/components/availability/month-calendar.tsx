"use client";

import { Icon } from "@/components/admin/icons";
import { cn } from "@/components/admin/ui";
import { formatMonth } from "@/lib/date";
import type { MonthDayDTO } from "@/types/availability";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function shiftMonth(month: string, delta: number): string {
  const [year, value] = month.split("-").map(Number);
  const date = new Date(year, value - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthFromKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

function cellsForMonth(month: string, days: MonthDayDTO[]) {
  const [year, value] = month.split("-").map(Number);
  const first = new Date(year, value - 1, 1);
  const leading = (first.getDay() + 6) % 7;
  const byDate = new Map(days.map((day) => [day.date, day]));

  const cells: Array<
    | { kind: "blank"; key: string }
    | { kind: "day"; key: string; day: MonthDayDTO; dayNumber: number }
  > = [];

  for (let index = 0; index < leading; index += 1) {
    cells.push({ kind: "blank", key: `blank-${index}` });
  }

  const total = new Date(year, value, 0).getDate();
  for (let day = 1; day <= total; day += 1) {
    const dateKey = `${month}-${String(day).padStart(2, "0")}`;
    const entry = byDate.get(dateKey) ?? {
      date: dateKey,
      status: "open" as const,
      availableCount: 0,
      bookedCount: 0,
      isClosed: false,
    };
    cells.push({ kind: "day", key: dateKey, day: entry, dayNumber: day });
  }

  return cells;
}

export function MonthCalendar({
  month,
  days,
  selected,
  onSelect,
  onMonthChange,
  minMonth,
  maxMonth,
  loading = false,
  mode = "public",
}: {
  month: string;
  days: MonthDayDTO[];
  selected: string | null;
  onSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
  minMonth?: string;
  maxMonth?: string;
  loading?: boolean;
  mode?: "admin" | "public";
}) {
  const cells = cellsForMonth(month, days);
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const canGoBack = !minMonth || previous >= minMonth;
  const canGoForward = !maxMonth || next <= maxMonth;

  return (
    <div className="rounded-[24px] border border-hairline/60 bg-surface/70 p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => canGoBack && onMonthChange(previous)}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline/70 text-cream transition hover:border-pink/60 hover:text-pink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <span aria-hidden="true" className="rotate-180">
            <Icon name="chevronRight" size={16} />
          </span>
        </button>

        <p className="text-[14px] font-semibold text-cream">
          {formatMonth(month)}
        </p>

        <button
          type="button"
          onClick={() => canGoForward && onMonthChange(next)}
          disabled={!canGoForward}
          aria-label="Next month"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-hairline/70 text-cream transition hover:border-pink/60 hover:text-pink disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="chevronRight" size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((label) => (
          <span
            key={label}
            className="pb-1 text-center text-[10px] uppercase tracking-[0.14em] text-muted/70"
          >
            {label}
          </span>
        ))}

        {loading
          ? Array.from({ length: 35 }).map((_, index) => (
              <div
                key={index}
                className="h-[46px] animate-pulse rounded-xl bg-white/[0.05]"
              />
            ))
          : cells.map((cell) => {
              if (cell.kind === "blank") {
                return <div key={cell.key} />;
              }

              const { day, dayNumber } = cell;
              const isSelected = selected === day.date;
              const clickable = mode === "admin" || day.status === "open";
              const isPast = day.status === "past";
              const isClosed = day.status === "closed";
              const isFull = day.status === "full";

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => clickable && onSelect(day.date)}
                  disabled={!clickable}
                  aria-pressed={isSelected}
                  title={
                    isPast
                      ? "Past date"
                      : isClosed
                        ? "Closed"
                        : isFull
                          ? "No times left"
                          : `${day.availableCount} open time${day.availableCount === 1 ? "" : "s"}`
                  }
                  className={cn(
                    "relative flex h-[46px] flex-col items-center justify-center rounded-xl border text-[12px] transition",
                    isSelected
                      ? "border-pink bg-pink text-canvas"
                      : isPast
                        ? "border-transparent text-muted/25"
                        : isClosed
                          ? "border-transparent text-muted/35 line-through"
                          : isFull
                            ? "border-amber-300/25 bg-amber-300/10 text-amber-200"
                            : "border-white/8 bg-white/[0.03] text-cream hover:border-pink/50",
                    !clickable && "cursor-not-allowed",
                  )}
                >
                  <span className="font-semibold leading-none">{dayNumber}</span>
                  {!isPast && !isClosed && day.availableCount > 0 ? (
                    <span
                      className={cn(
                        "mt-1 text-[9px] leading-none",
                        isSelected ? "text-canvas/70" : "text-muted",
                      )}
                    >
                      {day.availableCount} open
                    </span>
                  ) : !isPast && isClosed ? (
                    <span className="mt-1 text-[9px] leading-none">closed</span>
                  ) : null}
                </button>
              );
            })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cream/70" /> Open
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-amber-300" /> Full
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-muted/40" /> Closed
        </span>
      </div>
    </div>
  );
}
