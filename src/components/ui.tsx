import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-border bg-surface shadow-sm shadow-black/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles: Record<string, string> = {
    primary:
      "bg-brand text-white hover:bg-brand-strong disabled:opacity-50 disabled:cursor-not-allowed shadow-sm",
    secondary:
      "bg-brand-soft text-brand-strong hover:brightness-95 disabled:opacity-50",
    ghost: "bg-transparent text-foreground hover:bg-black/[0.04] disabled:opacity-50",
    danger: "bg-danger text-white hover:brightness-90 disabled:opacity-50",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-bold transition-colors ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatChip({ label, value, icon }: { label: string; value: ReactNode; icon?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-brand-soft px-4 py-2 text-brand-strong">
      {icon && <span className="text-lg">{icon}</span>}
      <div className="flex flex-col leading-tight">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-lg font-extrabold tabular-nums">{value}</span>
      </div>
    </div>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="w-full">
      <div className="h-3 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-gradient-to-l from-accent to-brand transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function PageShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 ${className}`}>{children}</div>
  );
}
