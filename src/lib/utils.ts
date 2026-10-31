import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(prefix = "id"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatDate(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy");
  } catch {
    return value;
  }
}

export function formatDateTime(value: string): string {
  try {
    return format(parseISO(value), "MMM d, yyyy · HH:mm");
  } catch {
    return value;
  }
}

export function relativeDate(value: string): string {
  try {
    return formatDistanceToNow(parseISO(value), { addSuffix: true });
  } catch {
    return value;
  }
}

export function todayInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function safeNumber(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}
