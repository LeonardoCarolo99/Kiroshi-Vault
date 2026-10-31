"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  eyebrow?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const SIZES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        className={cn(
          "hud-panel relative my-0 w-full animate-rise overflow-hidden shadow-[0_30px_120px_rgba(0,0,0,0.8)] sm:my-8",
          SIZES[size],
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4 sm:px-6">
          <div>
            {eyebrow ? <p className="hud-label text-cp-yellow">{eyebrow}</p> : null}
            {title ? (
              <h2 className="font-display mt-1 text-xl font-bold uppercase tracking-[0.06em] text-fog">
                {title}
              </h2>
            ) : null}
          </div>
          <button type="button" onClick={onClose} className="icon-btn shrink-0" aria-label="Close dialog">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4 sm:px-6">{footer}</div> : null}
      </section>
    </div>
  );
}
