import { fetchMonster, fetchResource } from "@/lib/api";
import { ArtifactsMap, MapContent } from "@/types/map";
import {
  ApiDrop,
  DropInfo,
  TileContentInfo,
  tileContentKey,
} from "@/types/tile-content";

/**
 * Résout le contenu (monstre, ressource, autre) de toutes les cases données,
 * dédupliqué par `type:code`. Générique : marche pour un voisinage 3×3 comme
 * pour la carte entière (contenus quasi statiques, cache fetch 1 h).
 */
export async function resolveTileContents(
  maps: (ArtifactsMap | null)[],
): Promise<Record<string, TileContentInfo>> {
  const uniqueContents = new Map<string, MapContent>();
  for (const map of maps) {
    const content = map?.interactions?.content;
    if (content) {
      uniqueContents.set(tileContentKey(content.type, content.code), content);
    }
  }

  const entries = await Promise.all(
    [...uniqueContents.entries()].map(async ([key, content]) => {
      const info = await resolveContent(content);
      return info ? ([key, info] as const) : null;
    }),
  );

  return Object.fromEntries(entries.filter((entry) => entry !== null));
}

async function resolveContent(
  content: MapContent,
): Promise<TileContentInfo | null> {
  switch (content.type) {
    case "monster": {
      const monster = await fetchMonster(content.code);
      return (
        monster && {
          kind: "monster",
          code: monster.code,
          name: monster.name,
          level: monster.level,
          hp: monster.hp,
          drops: monster.drops.map(toDropInfo),
        }
      );
    }
    case "resource": {
      const resource = await fetchResource(content.code);
      return (
        resource && {
          kind: "resource",
          code: resource.code,
          name: resource.name,
          skill: resource.skill,
          levelRequired: resource.level,
          drops: resource.drops.map(toDropInfo),
        }
      );
    }
    default:
      return { kind: "other", code: content.code, type: content.type };
  }
}

function toDropInfo(drop: ApiDrop): DropInfo {
  return {
    code: drop.code,
    rate: drop.rate,
    minQuantity: drop.min_quantity,
    maxQuantity: drop.max_quantity,
  };
}
