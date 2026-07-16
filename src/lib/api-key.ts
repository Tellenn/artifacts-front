/**
 * Nom du cookie portant la clé API Artifacts MMO saisie par l'utilisateur.
 * Écrit côté client (page Réglages), lu côté serveur (lib/api.ts) — un cookie
 * est le seul stockage navigateur visible des Server Components.
 */
export const API_KEY_COOKIE = "artifacts_api_key";

/** Lit la clé depuis document.cookie — navigateur uniquement (null côté serveur). */
export function readApiKeyCookieClient(): string | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${API_KEY_COOKIE}=`));
  return entry ? decodeURIComponent(entry.slice(API_KEY_COOKIE.length + 1)) : null;
}
