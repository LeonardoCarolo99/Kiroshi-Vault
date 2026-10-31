"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSound } from "@/hooks/useSound";

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
  const { playOpen, playClose } = useSound();

  useEffect(() => {
    if (!open) return;
    playOpen();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        playClose();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, playOpen, playClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center overflow-y-auto bg-black/80 p-0 pb-[calc(4rem+env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:items-center sm:p-4 sm:pb-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          playClose();
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "Dialog"}
        className={cn(
          "hud-panel relative my-0 w-full animate-scale overflow-hidden shadow-[0_40px_140px_rgba(0,0,0,0.85)] sm:my-8",
          SIZES[size],
          className,
        )}
        style={{
          maxHeight: "calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 5rem)",
        }}
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
          <button
            type="button"
            onClick={() => {
              playClose();
              onClose();
            }}
            className="icon-btn shrink-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(100dvh-14rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] overflow-y-auto px-5 py-5 sm:max-h-[calc(100vh-16rem)] sm:px-6">{children}</div>
        {footer ? <div className="border-t border-line px-5 py-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:px-6 sm:pb-4">{footer}</div> : null}
      </section>
    </div>
  );
}
