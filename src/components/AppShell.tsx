"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Boxes,
  ChevronRight,
  CircleDot,
  Database,
  Hand,
  LayoutDashboard,
  Layers3,
  ScanEye,
  Settings,
  ShoppingCart,
  Swords,
} from "lucide-react";
import { useVaultStore } from "@/lib/store";
import { cards } from "@/lib/cards";
import { cn } from "@/lib/utils";
import { BootTransition } from "@/components/BootTransition";
import { useSound } from "@/hooks/useSound";

const NAV = [
  { href: "/", label: "Command", icon: LayoutDashboard, code: "00" },
  { href: "/collection", label: "Collection", icon: Layers3, code: "01" },
  { href: "/decks", label: "Decks", icon: Boxes, code: "02" },
  { href: "/matches", label: "Matches", icon: Swords, code: "03" },
  { href: "/hand-tester", label: "Hand Tester", icon: Hand, code: "04" },
  { href: "/buy-list", label: "Buy List", icon: ShoppingCart, code: "05" },
  { href: "/friends", label: "Friends", icon: CircleDot, code: "06" },
];

const MOBILE_NAV = [
  { href: "/", label: "Command", icon: LayoutDashboard },
  { href: "/collection", label: "Collection", icon: Layers3 },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "/matches", label: "Matches", icon: Swords },
  { href: "/friends", label: "Friends", icon: CircleDot },
  { href: "/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="group flex items-center gap-3" aria-label="Kiroshi Vault home">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center border border-cp-yellow/60 bg-cp-yellow/10 text-cp-yellow clip-notch">
        <ScanEye className="h-5 w-5" strokeWidth={1.6} />
        <span className="absolute -right-1 -top-1 h-1.5 w-1.5 bg-cp-cyan" />
      </span>
      <span className={cn("leading-none", compact && "hidden sm:block")}>
        <span className="font-display block text-[15px] font-bold tracking-[0.24em] text-cp-yellow">
          KIROSHI
        </span>
        <span className="font-mono mt-1 block text-[9px] tracking-[0.42em] text-muted">
          VAULT // NC-2077
        </span>
      </span>
    </Link>
  );
}

function BootScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        (useVaultStore.getState() as any).setHasHydrated(true);
      } catch (e) {
        console.error(e);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-void">
      <div className="absolute inset-0 bg-hud-lines opacity-30" />
      <div className="relative flex flex-col items-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center border border-cp-yellow/60 bg-cp-yellow/10 text-cp-yellow clip-notch">
          <ScanEye className="h-8 w-8" strokeWidth={1.4} />
          <span className="absolute -right-1 -top-1 h-2 w-2 bg-cp-cyan" />
        </div>
        <p className="font-display text-xl font-bold tracking-[0.32em] text-cp-yellow">KIROSHI VAULT</p>
        <p className="font-mono mt-2 text-[10px] tracking-[0.28em] text-muted">
          INITIALIZING LOCAL DATABASE
        </p>
        <div className="mt-6 h-px w-56 overflow-hidden bg-line">
          <div className="h-full w-1/2 animate-pulse-line bg-cp-yellow" />
        </div>
        <p className="font-mono mt-3 text-[9px] tracking-[0.24em] text-muted/70">
          NIGHT CITY COLLECTION PROTOCOL
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { playNavigate, playBoot, playClick } = useSound();
  const hasHydrated = useVaultStore((state) => state.hasHydrated);
  const collection = useVaultStore((state) => state.collection);
  const decks = useVaultStore((state) => state.decks);
  const matches = useVaultStore((state) => state.matches);
  const [showBootTransition, setShowBootTransition] = useState(false);
  const [bootTransitionDone, setBootTransitionDone] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem("kiroshi-boot-done") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const forceHydrate = () => {
      try {
        (useVaultStore.getState() as any).setHasHydrated(true);
      } catch (e) {
        console.error(e);
      }
    };
    if (typeof window === "undefined") {
      forceHydrate();
      return;
    }
    try {
      const rehydrate = (useVaultStore.persist as any)?.rehydrate;
      if (typeof rehydrate === "function") {
        Promise.race([
          Promise.resolve(rehydrate()).catch(() => {}),
          new Promise((resolve) => setTimeout(resolve, 1500)),
        ]).finally(forceHydrate);
      } else {
        forceHydrate();
      }
    } catch {
      forceHydrate();
    }
    const timers = [300, 800, 1500, 2500].map((ms) => setTimeout(forceHydrate, ms));
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  useEffect(() => {
    if (hasHydrated && !bootTransitionDone) {
      try {
        if (sessionStorage.getItem("kiroshi-boot-done") === "true") {
          setBootTransitionDone(true);
          return;
        }
      } catch {}
      setShowBootTransition(true);
      playBoot();
    }
  }, [hasHydrated, bootTransitionDone, playBoot]);

  const ownedCards = useMemo(
    () => Object.values(collection).filter((count) => count > 0).length,
    [collection],
  );
  const totalCards = useMemo(
    () => Object.values(collection).reduce((sum, count) => sum + count, 0),
    [collection],
  );

  if (!hasHydrated) {
    return <BootScreen />;
  }

  if (showBootTransition && !bootTransitionDone) {
    return (
      <>
        <BootScreen />
        <BootTransition
          onComplete={() => {
            try {
              sessionStorage.setItem("kiroshi-boot-done", "true");
            } catch {}
            setBootTransitionDone(true);
            setShowBootTransition(false);
          }}
        />
      </>
    );
  }

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none fixed inset-y-0 left-0 z-0 hidden w-px bg-line/70 lg:block" />

      {/* Desktop rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] flex-col border-r border-line bg-ink/90 backdrop-blur-xl lg:flex">
        <div className="flex h-[84px] items-center border-b border-line px-6">
          <Logo />
        </div>

        <nav className="flex-1 px-3 py-5 animate-slide-left">
          <p className="hud-label px-3 pb-3">System Menu</p>
          <div className="stagger space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (pathname !== item.href) playNavigate();
                  }}
                  className={cn(
                    "group relative flex items-center gap-3 border border-transparent px-3 py-2.5 transition-all duration-200 ease-out",
                    active
                      ? "border-cp-yellow/25 bg-cp-yellow/8 text-cp-yellow"
                      : "text-muted hover:border-line hover:bg-white/[0.03] hover:text-fog hover:translate-x-1",
                  )}
                >
                  {active && (
                    <span className="absolute -left-px top-1/2 h-6 w-px -translate-y-1/2 bg-cp-yellow shadow-[0_0_12px_rgba(245,228,0,0.9)]" />
                  )}
                  <span className="font-mono w-5 text-[9px] tracking-widest opacity-50">{item.code}</span>
                  <Icon className="h-[17px] w-[17px]" strokeWidth={1.7} />
                  <span className="font-display flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase">
                    {item.label}
                  </span>
                  <ChevronRight
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      active ? "translate-x-0 opacity-80" : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-50",
                    )}
                  />
                </Link>
              );
            })}
          </div>

          <div className="hud-divider my-5" />
          <p className="hud-label px-3 pb-3">Archive</p>
          <Link
            href="/settings"
            onClick={() => {
              if (pathname !== "/settings") playNavigate();
            }}
            className={cn(
              "flex items-center gap-3 border border-transparent px-3 py-2.5 text-muted transition-all duration-200 ease-out hover:border-line hover:bg-white/[0.03] hover:text-fog hover:translate-x-1",
              pathname === "/settings" && "border-cp-yellow/25 bg-cp-yellow/8 text-cp-yellow",
            )}
          >
            <span className="font-mono w-5 text-[9px] tracking-widest opacity-50">07</span>
            <Settings className="h-[17px] w-[17px]" strokeWidth={1.7} />
            <span className="font-display flex-1 text-[12px] font-semibold tracking-[0.14em] uppercase">
              Settings
            </span>
          </Link>
        </nav>

        <div className="border-t border-line p-4">
          <div className="border border-line bg-black/25 p-3 clip-notch">
            <div className="flex items-center justify-between">
              <span className="hud-label">Local Mode</span>
              <span className="flex items-center gap-1.5 text-[9px] font-mono tracking-widest text-cp-green">
                <CircleDot className="h-2.5 w-2.5 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <p className="font-display text-lg leading-none text-fog">{ownedCards}</p>
                <p className="font-mono mt-1 text-[8px] tracking-[0.18em] text-muted">UNIQUE</p>
              </div>
              <div>
                <p className="font-display text-lg leading-none text-fog">{totalCards}</p>
                <p className="font-mono mt-1 text-[8px] tracking-[0.18em] text-muted">TOTAL</p>
              </div>
              <div>
                <p className="font-display text-lg leading-none text-fog">{decks.length}</p>
                <p className="font-mono mt-1 text-[8px] tracking-[0.18em] text-muted">DECKS</p>
              </div>
              <div>
                <p className="font-display text-lg leading-none text-fog">{matches.length}</p>
                <p className="font-mono mt-1 text-[8px] tracking-[0.18em] text-muted">MATCHES</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-line pt-2 text-[8px] font-mono tracking-[0.14em] text-muted">
              <Database className="h-3 w-3" />
              {cards.length} CARDS INDEXED
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-ink/95 px-4 backdrop-blur-xl lg:hidden">
        <Logo compact />
        <div className="flex items-center gap-2">
          <span className="badge badge-green">
            <CircleDot className="h-2.5 w-2.5" />
            Local
          </span>
          <Link href="/settings" className="icon-btn" aria-label="Settings" onClick={() => { playClick(); }}>
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="relative z-10 min-h-screen pb-24 lg:pb-0 lg:pl-[264px]">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>

      {/* Mobile nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden animate-slide-in-up">
        <div className="grid grid-cols-6">
          {MOBILE_NAV.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (pathname !== item.href) playNavigate();
                }}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 transition-colors",
                  active ? "text-cp-yellow" : "text-muted",
                )}
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2 : 1.6} />
                <span className="font-mono text-[8px] tracking-[0.1em] uppercase">{item.label}</span>
                <span className={cn("h-px w-5", active ? "bg-cp-yellow" : "bg-transparent")} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
