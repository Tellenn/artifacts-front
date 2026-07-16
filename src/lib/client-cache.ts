"use client";

/**
 * Petit cache localStorage avec TTL pour les données quasi statiques de l'API
 * publique (maps, monstres, ressources) : évite de re-télécharger à chaque
 * chargement de page et de percuter le rate limit. Toujours best-effort —
 * quota plein ou localStorage indisponible ne doivent jamais casser l'appli.
 */

const PREFIX = "artifacts_cache:";

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

export function cacheGet<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    if (typeof entry?.expiresAt !== "number" || entry.expiresAt < Date.now()) {
      window.localStorage.removeItem(PREFIX + key);
      return null;
    }
    return entry.value;
  } catch {
    return null;
  }
}

export function cacheSet<T>(key: string, value: T, ttlMs: number) {
  if (typeof window === "undefined") return;
  try {
    const entry: CacheEntry<T> = { expiresAt: Date.now() + ttlMs, value };
    window.localStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // Quota plein : on vit sans cache plutôt que de planter.
  }
}
