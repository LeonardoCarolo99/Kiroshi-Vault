"use client";

import { useEffect, useState } from "react";
import { onAuthChange } from "@/lib/auth";
import { useVaultStore } from "@/lib/store";

export function AuthSyncProvider({ children }: { children: React.ReactNode }) {
  const setUser = useVaultStore((state) => state.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const unsub = onAuthChange((user) => {
        try {
          setUser(user);
        } catch (e) {
          console.error(e);
        }
      });
      return () => {
        try {
          unsub();
        } catch (e) {
          console.error(e);
        }
      };
    } catch (e) {
      console.error("auth init failed", e);
      return;
    }
  }, [setUser]);

  return <>{children}</>;
}
