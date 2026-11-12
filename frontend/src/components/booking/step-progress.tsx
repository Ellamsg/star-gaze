type StepProgressProps = {
  total: number;
  /** Zero-based index of the current step. */
  current: number;
};

/** Three-segment bar, matching the booking screens. */
export function StepProgress({ total, current }: StepProgressProps) {
  return (
    <div
      role="progressbar"
      aria-label="Booking progress"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current + 1}
      aria-valuetext={`Step ${current + 1} of ${total}`}
      className="flex gap-2"
    >
      {Array.from({ length: total }).map((_, index) => (
        <span
          key={index}
          className={`h-[3px] flex-1 rounded-full transition-colors ${
            index <= current ? "bg-pink" : "bg-white/12"
          }`}
        />
      ))}
    </div>
  );
}
