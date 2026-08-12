/** A small vertical bar time-series (attempts per day), one hue, baseline-anchored. */
export function DailyBars({ data }: { data: { date: string; count: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="viz-root">
      <div className="flex h-32 items-end gap-1.5">
        {data.map((d) => {
          const h = Math.max(2, (d.count / max) * 100);
          return (
            <div key={d.date} className="group relative flex h-full flex-1 flex-col items-center justify-end">
              {d.count > 0 && (
                <span
                  className="mb-1 text-[10px] font-bold tabular-nums"
                  style={{ color: "var(--viz-text-secondary)" }}
                >
                  {d.count}
                </span>
              )}
              <div
                className="w-full rounded-t-[4px] transition-[height] duration-500"
                style={{ height: `${h}%`, background: "var(--viz-series-1)", minHeight: 2 }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5">
        {data.map((d, i) => (
          <div
            key={d.date}
            className="flex-1 text-center text-[9px]"
            style={{ color: "var(--viz-muted)" }}
          >
            {i % 2 === 0 ? d.date.slice(5) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
