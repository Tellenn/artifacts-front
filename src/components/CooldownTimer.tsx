"use client";

import { useSyncExternalStore } from "react";

interface CooldownTimerProps {
  /** Date ISO d'expiration du cooldown, ou null si aucun. */
  expiration: string | null;
}

// L'horloge est la source de données externe : notifie chaque seconde.
function subscribe(onTick: () => void): () => void {
  const id = setInterval(onTick, 1000);
  return () => clearInterval(id);
}

function secondsLeft(expiration: string): number {
  return Math.max(0, Math.ceil((new Date(expiration).getTime() - Date.now()) / 1000));
}

/**
 * Décompte de cooldown en direct, côté client. Le snapshot serveur est null :
 * le rendu serveur n'affiche rien, ce qui évite tout mismatch d'horloge
 * serveur/client ; le décompte apparaît dès l'hydratation puis se met à jour
 * chaque seconde.
 */
export function CooldownTimer({ expiration }: CooldownTimerProps) {
  const remaining = useSyncExternalStore(
    subscribe,
    () => (expiration === null ? null : secondsLeft(expiration)),
    () => null,
  );

  if (remaining === null || remaining <= 0) {
    return null;
  }

  return <span className="ml-auto font-medium text-orange-400">⏳ {remaining}s</span>;
}
