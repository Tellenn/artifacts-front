import { fetchMonster, fetchResource } from "@/lib/api";
import { ArtifactsMap, MapContent } from "@/types/map";
import {
  ApiDrop,
  DropInfo,
  TileContentInfo,
  tileContentKey,
} from "@/types/tile-content";

/** Résolutions simultanées max vers l'API publique — évite un burst rate-limité à froid. */
const RESOLVE_BATCH_SIZE = 10;

/**
 * Résout le contenu (monstre, ressource, autre) de toutes les cases données,
 * dédupliqué par `type:code`. Générique : marche pour un voisinage 3×3 comme
 * pour la carte entière (contenus quasi statiques, cache fetch long).
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

  const pending = [...uniqueContents.entries()];
  const resolved: (readonly [string, TileContentInfo])[] = [];

  for (let i = 0; i < pending.length; i += RESOLVE_BATCH_SIZE) {
    const batch = await Promise.all(
      pending.slice(i, i + RESOLVE_BATCH_SIZE).map(async ([key, content]) => {
        const info = await resolveContentSafely(content);
        return info ? ([key, info] as const) : null;
      }),
    );
    resolved.push(...batch.filter((entry) => entry !== null));
  }

  return Object.fromEntries(resolved);
}

/**
 * Un contenu illisible (réponse upstream inattendue, rate limit déguisé en 200)
 * ne doit jamais faire tomber le rendu : tooltip absent, pas de 500.
 */
async function resolveContentSafely(
  content: MapContent,
): Promise<TileContentInfo | null> {
  try {
    return await resolveContent(content);
  } catch {
    return null;
  }
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
          drops: toDropInfos(monster.drops),
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
          drops: toDropInfos(resource.drops),
        }
      );
    }
    default:
      return { kind: "other", code: content.code, type: content.type };
  }
}

// `drops` peut manquer si l'upstream renvoie une réponse dégradée (déjà vu en
// prod, mise en cache par Next pendant 1 h) — ne jamais lui faire confiance.
function toDropInfos(drops: ApiDrop[] | undefined): DropInfo[] {
  if (!Array.isArray(drops)) {
    return [];
  }
  return drops.map((drop) => ({
    code: drop.code,
    rate: drop.rate,
    minQuantity: drop.min_quantity,
    maxQuantity: drop.max_quantity,
  }));
}
