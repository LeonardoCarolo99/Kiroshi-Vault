"use client";

export type SoundType =
  | "click"
  | "hover"
  | "navigate"
  | "open"
  | "close"
  | "success"
  | "error"
  | "boot"
  | "glitch"
  | "toggle"
  | "select";

const soundFiles: Record<SoundType, string> = {
  click: "/sounds/click.mp3",
  hover: "/sounds/hover.mp3",
  navigate: "/sounds/navigate.mp3",
  open: "/sounds/open.mp3",
  close: "/sounds/close.mp3",
  success: "/sounds/success.mp3",
  error: "/sounds/error.mp3",
  boot: "/sounds/boot.mp3",
  glitch: "/sounds/glitch.mp3",
  toggle: "/sounds/toggle.mp3",
  select: "/sounds/select.mp3",
};

class CyberpunkSoundSystem {
  private audioCache = new Map<SoundType, HTMLAudioElement>();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("kiroshi-sounds-enabled");
        this.enabled = saved !== "false";
        const vol = localStorage.getItem("kiroshi-sounds-volume");
        if (vol !== null) {
          this.volume = Math.max(0, Math.min(1, parseFloat(vol)));
        }
      } catch {}
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("kiroshi-sounds-enabled", enabled ? "true" : "false");
      } catch {}
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("kiroshi-sounds-volume", this.volume.toString());
      } catch {}
    }
    this.audioCache.forEach((audio) => {
      audio.volume = this.volume;
    });
  }

  getVolume(): number {
    return this.volume;
  }

  private getAudio(type: SoundType): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (this.audioCache.has(type)) {
      return this.audioCache.get(type)!;
    }
    try {
      const audio = new Audio(soundFiles[type]);
      audio.volume = this.volume;
      audio.preload = "auto";
      this.audioCache.set(type, audio);
      return audio;
    } catch (e) {
      console.error("Failed to create audio for", type, e);
      return null;
    }
  }

  play(type: SoundType) {
    if (!this.enabled) return;
    const audio = this.getAudio(type);
    if (!audio) return;
    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.debug("Audio play failed (user interaction required?):", err);
        });
      }
    } catch (e) {
      console.error("Failed to play sound", type, e);
    }
  }
}

export const soundSystem = new CyberpunkSoundSystem();
