"use client";

import { ArtifactsMap } from "@/types/map";

const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";

let mapsPromise: Promise<ArtifactsMap[]> | null = null;

/**
 * Toutes les cartes du jeu, chargées une seule fois par session navigateur
 * (données quasi statiques, ~1400 entrées). `[]` en cas d'échec — et on
 * retentera au prochain appel plutôt que de mettre l'échec en cache.
 */
export function loadAllMapsClient(): Promise<ArtifactsMap[]> {
  if (!mapsPromise) {
    mapsPromise = fetchAllMaps().catch(() => {
      mapsPromise = null;
      return [];
    });
  }
  return mapsPromise;
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
