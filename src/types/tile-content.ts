// Contenu résolu d'une case de carte (monstre, ressource, ou autre bâtiment),
// enrichi via l'API publique Artifacts MMO pour alimenter les tooltips.

/** Miroir partiel du JSON de l'API publique (drops de /monsters et /resources). */
export interface ApiDrop {
  code: string;
  rate: number;
  min_quantity: number;
  max_quantity: number;
}

/** Miroir partiel de GET /monsters/{code}. */
export interface MonsterData {
  code: string;
  name: string;
  level: number;
  hp: number;
  drops: ApiDrop[];
}

/** Miroir partiel de GET /resources/{code}. */
export interface ResourceData {
  code: string;
  name: string;
  skill: string;
  level: number;
  drops: ApiDrop[];
}

export interface DropInfo {
  code: string;
  /** Taux de drop : 1 chance sur `rate`. */
  rate: number;
  minQuantity: number;
  maxQuantity: number;
}

export interface MonsterTileContent {
  kind: "monster";
  code: string;
  name: string;
  level: number;
  hp: number;
  drops: DropInfo[];
}

export interface ResourceTileContent {
  kind: "resource";
  code: string;
  name: string;
  skill: string;
  levelRequired: number;
  drops: DropInfo[];
}

/** Contenu sans données de loot (banque, atelier, PNJ…) — tooltip minimal. */
export interface OtherTileContent {
  kind: "other";
  code: string;
  type: string;
}

export type TileContentInfo =
  | MonsterTileContent
  | ResourceTileContent
  | OtherTileContent;

/** Clé d'index partagée entre la résolution serveur et l'affichage des cases. */
export function tileContentKey(type: string, code: string): string {
  return `${type}:${code}`;
}
