/**
 * Nom du cookie portant la clé API Artifacts MMO saisie par l'utilisateur.
 * Écrit côté client (page Réglages), lu côté serveur (lib/api.ts) — un cookie
 * est le seul stockage navigateur visible des Server Components.
 */
export const API_KEY_COOKIE = "artifacts_api_key";
