"use client";

import { ArtifactsMap } from "@/types/map";
import { cacheGet, cacheSet } from "@/lib/client-cache";

const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";

const MAPS_CACHE_KEY = "maps:all";
/** Aligné sur le revalidate serveur : les cartes sont quasi statiques. */
const MAPS_TTL_MS = 60 * 60 * 1000;

let mapsPromise: Promise<ArtifactsMap[]> | null = null;

/**
 * Toutes les cartes du jeu (~1400 entrées) : localStorage (TTL 1 h) d'abord,
 * sinon un seul téléchargement par session. `[]` en cas d'échec — et on
 * retentera au prochain appel plutôt que de mettre l'échec en cache.
 */
export function loadAllMapsClient(): Promise<ArtifactsMap[]> {
  if (!mapsPromise) {
    mapsPromise = loadMaps().catch(() => {
      mapsPromise = null;
      return [];
    });
  }
  return mapsPromise;
}

async function loadMaps(): Promise<ArtifactsMap[]> {
  const cached = cacheGet<ArtifactsMap[]>(MAPS_CACHE_KEY);
  if (cached && cached.length > 0) return cached;

  const maps = await fetchAllMaps();
  cacheSet(MAPS_CACHE_KEY, maps, MAPS_TTL_MS);
  return maps;
}

async function fetchAllMaps(): Promise<ArtifactsMap[]> {
  const maps: ArtifactsMap[] = [];
  let page = 1;
  let pages = 1;

  do {
    const response = await fetch(
      `${ARTIFACTS_PUBLIC_API}/maps?size=100&page=${page}`,
    );
    if (!response.ok) {
      throw new Error(`Erreur API maps: ${response.status}`);
    }
    const body: { data: ArtifactsMap[]; pages: number } = await response.json();
    maps.push(...body.data);
    pages = body.pages;
    page++;
  } while (page <= pages);

  return maps;
}
