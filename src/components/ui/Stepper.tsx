"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  compact?: boolean;
  label?: string;
};

export function Stepper({ value, onChange, min = 0, max = 999, compact, label }: StepperProps) {
  const { playClick } = useSound();

  return (
    <div
      className={cn(
        "inline-flex items-center border border-line bg-black/35",
        compact ? "h-7" : "h-9",
      )}
      aria-label={label}
    >
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-muted transition-colors hover:bg-white/5 hover:text-fog disabled:opacity-30",
          compact ? "h-7 w-7" : "h-9 w-9",
        )}
        onClick={() => {
          playClick();
          onChange(Math.max(min, value - 1));
        }}
        disabled={value <= min}
        aria-label="Decrease"
      >
        <Minus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
      <span
        className={cn(
          "font-mono flex min-w-7 items-center justify-center border-x border-line text-center tabular-nums",
          compact ? "h-7 px-1 text-[11px]" : "h-9 px-2 text-sm",
          value > 0 ? "text-cp-yellow" : "text-muted",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        className={cn(
          "flex items-center justify-center text-muted transition-colors hover:bg-white/5 hover:text-fog disabled:opacity-30",
          compact ? "h-7 w-7" : "h-9 w-9",
        )}
        onClick={() => {
          playClick();
          onChange(Math.min(max, value + 1));
        }}
        disabled={value >= max}
        aria-label="Increase"
      >
        <Plus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      </button>
    </div>
  );
}
