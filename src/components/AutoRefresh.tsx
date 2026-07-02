"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Intervalle de rafraîchissement en secondes. */
  intervalSeconds?: number;
}

/**
 * Redemande le rendu serveur à intervalle régulier (router.refresh),
 * pour que « Actualisé toutes les 10s » soit vrai sans polling client
 * vers l'API : le fetch reste côté serveur.
 */
export function AutoRefresh({ intervalSeconds = 10 }: AutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) {
        router.refresh();
      }
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [router, intervalSeconds]);

  return null;
}
