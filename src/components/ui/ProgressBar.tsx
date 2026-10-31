import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  max?: number;
  color?: string;
  className?: string;
  showLabel?: boolean;
  label?: string;
};

export function ProgressBar({ value, max = 100, color = "#f5e400", className, showLabel, label }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0));
  return (
    <div className={cn("w-full", className)}>
      {showLabel ? (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">{label}</span>
          <span className="font-mono text-[9px] tracking-[0.1em] text-muted">
            {value}/{max}
          </span>
        </div>
      ) : null}
      <div className="h-1.5 w-full overflow-hidden bg-white/6">
        <div
          className="h-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 16px ${color}66` }}
        />
      </div>
    </div>
  );
}
