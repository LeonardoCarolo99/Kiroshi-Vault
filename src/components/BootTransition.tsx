"use client";

import { ScanEye } from "lucide-react";
import { useEffect, useState } from "react";
import { useSound } from "@/hooks/useSound";

interface BootTransitionProps {
  onComplete: () => void;
}

export function BootTransition({ onComplete }: BootTransitionProps) {
  const { playGlitch } = useSound();
  const [phase, setPhase] = useState<"booting" | "glitch" | "fade">("booting");
  const [progress, setProgress] = useState(0);
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    const bootLines = [
      "CONNECTING TO KIROSHI NEURAL NET...",
      "BYPASSING ICE PROTOCOLS...",
      "LOADING CYBERDECK INTERFACE...",
      "SYNCING CHROME DATA...",
      "MOUNTING VAULT ARCHIVES...",
      "INITIALIZING COMBAT PROTOCOLS...",
      "ACCESS GRANTED",
    ];

    let lineIndex = 0;
    const lineInterval = setInterval(() => {
      if (lineIndex < bootLines.length) {
        setLines((prev) => [...prev, bootLines[lineIndex]]);
        lineIndex++;
      } else {
        clearInterval(lineInterval);
      }
    }, 120);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 80);

    const glitchTimer = setTimeout(() => {
      playGlitch();
      setPhase("glitch");
    }, 1400);

    const fadeTimer = setTimeout(() => {
      setPhase("fade");
    }, 1900);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearInterval(lineInterval);
      clearInterval(progressInterval);
      clearTimeout(glitchTimer);
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[210] flex flex-col bg-void transition-opacity duration-500 ${
        phase === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="boot-noise" />
      <div className="boot-scanline" />
      <div className="absolute inset-0 bg-hud-lines opacity-20" />

      <div className="relative flex h-full flex-col justify-between p-4 sm:p-6 lg:p-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center border border-cp-yellow/60 bg-cp-yellow/10 text-cp-yellow clip-notch boot-flicker">
              <ScanEye className="h-5 w-5" strokeWidth={1.6} />
              <span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-cp-cyan" />
            </div>
            <div>
              <p className="font-display text-sm font-bold tracking-[0.28em] text-cp-yellow boot-glitch-text">
                KIROSHI SYSTEMS
              </p>
              <p className="font-mono text-[8px] tracking-[0.22em] text-muted">
                NETRUNNER INTERFACE v2.077
              </p>
            </div>
          </div>
          <div className="font-mono text-[9px] tracking-[0.18em] text-cp-cyan">
            {phase === "glitch" ? "CONNECTION_UNSTABLE" : "SECURE LINK"}
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-2xl">
            <div className="mb-6 border border-line bg-black/40 p-4 clip-notch sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="hud-label">System Boot Sequence</p>
                <p className="font-mono text-[9px] text-cp-yellow">{Math.min(100, Math.floor(progress))}%</p>
              </div>
              <div className="mb-4 h-1 w-full overflow-hidden bg-line">
                <div
                  className="h-full bg-gradient-to-r from-cp-yellow via-cp-cyan to-cp-yellow transition-all duration-100"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <div className="space-y-1 font-mono text-[10px] leading-relaxed sm:text-[11px]">
                {lines.map((line, i) => (
                  <div key={i} className="flex gap-2 boot-slide-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <span className="text-cp-green">&gt;</span>
                    <span className={line && line.includes("ACCESS GRANTED") ? "text-cp-cyan boot-glitch-text" : "text-fog/90"}>
                      {line}
                    </span>
                  </div>
                ))}
                {phase === "booting" && progress < 100 && (
                  <div className="flex gap-2">
                    <span className="text-cp-green">&gt;</span>
                    <span className="animate-pulse text-cp-yellow">_</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        <footer className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="font-mono text-[8px] tracking-[0.16em] text-muted">
            BLACKWALL COMPATIBLE | ENCRYPTION: AES-4096
          </p>
          <p className="font-mono text-[8px] tracking-[0.16em] text-muted/60">
            ARASAKA SUBNET DETECTED
          </p>
        </footer>
      </div>
    </div>
  );
}
