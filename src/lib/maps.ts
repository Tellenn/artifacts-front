import { ArtifactsMap } from "@/types/map";

export type MapLookup = Map<string, ArtifactsMap>;

function mapKey(layer: string, x: number, y: number): string {
  return `${layer}:${x}:${y}`;
}

export function buildMapLookup(maps: ArtifactsMap[]): MapLookup {
  return new Map(maps.map((m) => [mapKey(m.layer, m.x, m.y), m]));
}

/**
 * Les 9 cartes centrées sur (x, y) dans le layer donné, ligne par ligne
 * du nord-ouest au sud-est (le nord est y - 1). `null` = bord du monde.
 */
export function getNeighborhood(
  lookup: MapLookup,
  x: number,
  y: number,
  layer: string,
): (ArtifactsMap | null)[] {
  const cells: (ArtifactsMap | null)[] = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      cells.push(lookup.get(mapKey(layer, x + dx, y + dy)) ?? null);
    }
  }

  return cells;
}
