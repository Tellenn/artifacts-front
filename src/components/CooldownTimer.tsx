"use client";

import { useEffect, useState } from "react";

interface CooldownTimerProps {
  /** Date ISO d'expiration du cooldown, ou null si aucun. */
  expiration: string | null;
}

function secondsLeft(expiration: string): number {
  return Math.max(0, Math.ceil((new Date(expiration).getTime() - Date.now()) / 1000));
}

export function CooldownTimer({ expiration }: CooldownTimerProps) {
  // null jusqu'au montage : le rendu serveur et la première hydratation
  // n'affichent rien, ce qui évite tout mismatch d'horloge serveur/client.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (expiration === null) {
      setRemaining(null);
      return;
    }

    const update = () => setRemaining(secondsLeft(expiration));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiration]);

  if (remaining === null || remaining <= 0) {
    return null;
  }

  return <span className="ml-auto font-medium text-orange-400">⏳ {remaining}s</span>;
}
