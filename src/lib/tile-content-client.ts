"use client";

import { ArtifactsMap, MapContent } from "@/types/map";
import {
  MonsterData,
  ResourceData,
  TileContentInfo,
  tileContentKey,
} from "@/types/tile-content";
import { buildMonsterInfo, buildResourceInfo } from "@/lib/tile-content-shared";

const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";

/** Cache mémoire par session : contenus quasi statiques, null = échec (retentable). */
const contentCache = new Map<string, TileContentInfo | null>();

/**
 * Variante navigateur de resolveTileContents : résout les contenus manquants
 * des cases données et retourne uniquement les entrées résolues. Jamais
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

  const resolved: (readonly [string, TileContentInfo])[] = [];
  await Promise.all(
    [...uniqueContents.entries()].map(async ([key, content]) => {
      const info = await resolveContentCached(key, content);
      if (info) resolved.push([key, info] as const);
    }),
  );

  return Object.fromEntries(resolved);
}

async function resolveContentCached(
  key: string,
  content: MapContent,
): Promise<TileContentInfo | null> {
  const cached = contentCache.get(key);
  if (cached) return cached;

  const info = await resolveContent(content).catch(() => null);
  if (info) contentCache.set(key, info);
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
