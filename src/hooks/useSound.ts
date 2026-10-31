"use client";

import { soundSystem, type SoundType } from "@/lib/sounds";

export function useSound() {
  return {
    play: (type: SoundType) => soundSystem.play(type),
    playClick: () => soundSystem.play("click"),
    playHover: () => soundSystem.play("hover"),
    playNavigate: () => soundSystem.play("navigate"),
    playOpen: () => soundSystem.play("open"),
    playClose: () => soundSystem.play("close"),
    playSuccess: () => soundSystem.play("success"),
    playError: () => soundSystem.play("error"),
    playBoot: () => soundSystem.play("boot"),
    playGlitch: () => soundSystem.play("glitch"),
    playToggle: () => soundSystem.play("toggle"),
    playSelect: () => soundSystem.play("select"),
    setEnabled: (enabled: boolean) => soundSystem.setEnabled(enabled),
    isEnabled: () => soundSystem.isEnabled(),
    setVolume: (volume: number) => soundSystem.setVolume(volume),
    getVolume: () => soundSystem.getVolume(),
  };
}
