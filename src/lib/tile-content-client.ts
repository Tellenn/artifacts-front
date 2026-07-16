"use client";

import { ArtifactsMap, MapContent } from "@/types/map";
import {
  MonsterData,
  ResourceData,
  TileContentInfo,
  tileContentKey,
} from "@/types/tile-content";
import { buildMonsterInfo, buildResourceInfo } from "@/lib/tile-content-shared";
import { cacheGet, cacheSet } from "@/lib/client-cache";

const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";

/** Résolutions simultanées max — un burst parallèle percute le rate limit public. */
const RESOLVE_BATCH_SIZE = 5;

/** Contenus quasi statiques : 24 h, aligné sur le revalidate serveur. */
const CONTENT_TTL_MS = 24 * 60 * 60 * 1000;

/** Cache mémoire par session, devant le localStorage. null = échec (retentable). */
const contentCache = new Map<string, TileContentInfo | null>();

/**
 * Variante navigateur de resolveTileContents : mémoire → localStorage → API
 * publique (par lots). Retourne uniquement les entrées résolues. Jamais
 * bloquant — un échec rend un tooltip absent, pas une erreur.
 */
export async function resolveTileContentsClient(
  maps: (ArtifactsMap | null)[],
): Promise<Record<string, TileContentInfo>> {
  const uniqueContents = new Map<string, MapContent>();
  for (const map of maps) {
    const content = map?.interactions?.content;
    if (content) {
      uniqueContents.set(tileContentKey(content.type, content.code), content);
    }
  }

  const pending = [...uniqueContents.entries()];
  const resolved: (readonly [string, TileContentInfo])[] = [];

  for (let i = 0; i < pending.length; i += RESOLVE_BATCH_SIZE) {
    const batch = await Promise.all(
      pending.slice(i, i + RESOLVE_BATCH_SIZE).map(async ([key, content]) => {
        const info = await resolveContentCached(key, content);
        return info ? ([key, info] as const) : null;
      }),
    );
    resolved.push(...batch.filter((entry) => entry !== null));
  }

  return Object.fromEntries(resolved);
}

async function resolveContentCached(
  key: string,
  content: MapContent,
): Promise<TileContentInfo | null> {
  const inMemory = contentCache.get(key);
  if (inMemory) return inMemory;

  const stored = cacheGet<TileContentInfo>(`tile:${key}`);
  if (stored) {
    contentCache.set(key, stored);
    return stored;
  }

  const info = await resolveContent(content).catch(() => null);
  if (info) {
    contentCache.set(key, info);
    cacheSet(`tile:${key}`, info, CONTENT_TTL_MS);
  }
  return info;
}

async function resolveContent(
  content: MapContent,
): Promise<TileContentInfo | null> {
  switch (content.type) {
    case "monster": {
      const monster = await fetchPublicDetail<MonsterData>(`/monsters/${content.code}`);
      return monster && buildMonsterInfo(monster);
    }
    case "resource": {
      const resource = await fetchPublicDetail<ResourceData>(`/resources/${content.code}`);
      return resource && buildResourceInfo(resource);
    }
    default:
      return { kind: "other", code: content.code, type: content.type };
  }
}

async function fetchPublicDetail<T>(path: string): Promise<T | null> {
  const response = await fetch(`${ARTIFACTS_PUBLIC_API}${path}`);
  if (!response.ok) return null;

  const body: { data: T } = await response.json();
  // Réponse dégradée renvoyée en 200 : forme validée avant usage.
  if (typeof body?.data !== "object" || body.data === null) return null;
  return body.data;
}
