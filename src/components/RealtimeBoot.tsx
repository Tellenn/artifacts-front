"use client";

import { useEffect } from "react";
import { syncRealtimeConnection } from "@/lib/realtime";

/** Monte la connexion WSS temps réel (si une clé API est enregistrée). */
export function RealtimeBoot() {
  useEffect(() => {
    syncRealtimeConnection();
  }, []);

  return null;
}
