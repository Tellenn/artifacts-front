"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRealtimeStatus } from "@/lib/realtime";

interface AutoRefreshProps {
  /** Intervalle de rafraîchissement en secondes. */
  intervalSeconds?: number;
}

/**
 * Redemande le rendu serveur à intervalle régulier (router.refresh) —
 * uniquement quand le temps réel WSS n'est pas connecté : dès que les
 * personnages arrivent en push, le polling n'a plus de raison d'être.
 */
export function AutoRefresh({ intervalSeconds = 10 }: AutoRefreshProps) {
  const router = useRouter();
  const realtimeStatus = useRealtimeStatus();

  useEffect(() => {
    if (realtimeStatus === "connected") return;

    const id = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [router, intervalSeconds, realtimeStatus]);

  return null;
}
