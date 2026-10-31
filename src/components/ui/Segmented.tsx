"use client";

import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

type Option<T extends string> = {
  value: T;
  label: string;
  tone?: "default" | "green" | "red" | "yellow" | "cyan";
};

type SegmentedProps<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

const TONES = {
  default: "border-line-bright bg-white/8 text-fog",
  green: "border-cp-green/60 bg-cp-green/15 text-cp-green",
  red: "border-cp-red/60 bg-cp-red/15 text-cp-red",
  yellow: "border-cp-yellow/60 bg-cp-yellow/15 text-cp-yellow",
  cyan: "border-cp-cyan/60 bg-cp-cyan/15 text-cp-cyan",
};

export function Segmented<T extends string>({ options, value, onChange, className }: SegmentedProps<T>) {
  const { playClick } = useSound();

  return (
    <div className={cn("grid gap-1 border border-line bg-black/30 p-1", className)} style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => {
              playClick();
              onChange(option.value);
            }}
            className={cn(
              "font-mono border px-2 py-2 text-[9px] tracking-[0.12em] uppercase transition-all",
              active ? TONES[option.tone ?? "default"] : "border-transparent text-muted hover:bg-white/5 hover:text-fog",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
