// Constructeurs purs de TileContentInfo, partagés entre la résolution serveur
// (lib/tile-content.ts) et client (lib/tile-content-client.ts).

import { MonsterData, ResourceData } from "@/types/tile-content";
import {
  ApiDrop,
  DropInfo,
  TileContentInfo,
} from "@/types/tile-content";

export function buildMonsterInfo(monster: MonsterData): TileContentInfo {
  return {
    kind: "monster",
    code: monster.code,
    name: monster.name,
    level: monster.level,
    hp: monster.hp,
    drops: toDropInfos(monster.drops),
  };
}

export function buildResourceInfo(resource: ResourceData): TileContentInfo {
  return {
    kind: "resource",
    code: resource.code,
    name: resource.name,
    skill: resource.skill,
    levelRequired: resource.level,
    drops: toDropInfos(resource.drops),
  };
}

// `drops` peut manquer si l'upstream renvoie une réponse dégradée (déjà vu en
// prod, mise en cache par Next pendant 1 h) — ne jamais lui faire confiance.
export function toDropInfos(drops: ApiDrop[] | undefined): DropInfo[] {
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
