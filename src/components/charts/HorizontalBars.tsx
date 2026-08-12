/**
 * A ranked horizontal bar list — one hue (sequential, magnitude), thin marks,
 * rounded data-ends, direct value labels (never color-alone). See dataviz skill.
 */
export function HorizontalBars({
  items,
  valueSuffix = "%",
  formatValue,
}: {
  items: { label: string; value: number; sublabel?: string }[];
  valueSuffix?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="viz-root flex flex-col gap-3">
      {items.map((item) => {
        const pct = Math.max(2, (item.value / max) * 100);
        return (
          <div key={item.label} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2 text-sm">
              <span className="font-bold" style={{ color: "var(--viz-text-primary)" }}>
                {item.label}
                {item.sublabel && (
                  <span className="mr-2 font-normal" style={{ color: "var(--viz-text-secondary)" }}>
                    {item.sublabel}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-extrabold tabular-nums" style={{ color: "var(--viz-text-primary)" }}>
                {formatValue ? formatValue(item.value) : `${item.value.toFixed(0)}${valueSuffix}`}
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full" style={{ background: "var(--viz-grid)" }}>
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${pct}%`, background: "var(--viz-series-1)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
