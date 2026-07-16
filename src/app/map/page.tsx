import Link from "next/link";
import { fetchAllMaps, fetchCharacters } from "@/lib/api";
import { resolveTileContents } from "@/lib/tile-content";
import { buildMapLookup } from "@/lib/maps";
import { MapTile } from "@/components/MapTile";
import { MapCharacterMarkers } from "@/components/MapCharacterMarkers";
import { ArtifactsCharacter } from "@/types/character";
import { ArtifactsMap } from "@/types/map";
import { tileContentKey } from "@/types/tile-content";

export const dynamic = "force-dynamic";

const LAYER_LABELS: Record<string, string> = {
  overworld: "Surface",
  underground: "Souterrain",
  interior: "Intérieur",
};

function layerLabel(layer: string): string {
  return LAYER_LABELS[layer] ?? layer.charAt(0).toUpperCase() + layer.slice(1);
}

/** Layers uniques, surface d'abord — ordre stable pour les onglets. */
function extractLayers(maps: ArtifactsMap[]): string[] {
  const layers = [...new Set(maps.map((m) => m.layer))].sort();
  const overworldIndex = layers.indexOf("overworld");
  if (overworldIndex > 0) {
    layers.splice(overworldIndex, 1);
    layers.unshift("overworld");
  }
  return layers;
}

interface Bounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

function computeBounds(maps: ArtifactsMap[]): Bounds {
  return {
    minX: Math.min(...maps.map((m) => m.x)),
    maxX: Math.max(...maps.map((m) => m.x)),
    minY: Math.min(...maps.map((m) => m.y)),
    maxY: Math.max(...maps.map((m) => m.y)),
  };
}

interface PageProps {
  searchParams: Promise<{ layer?: string }>;
}

export default async function MapPage({ searchParams }: PageProps) {
  const { layer } = await searchParams;

  const [maps, characters] = await Promise.all([
    fetchAllMaps(),
    fetchCharacters().catch(() => [] as ArtifactsCharacter[]),
  ]);

  if (maps.length === 0) {
    return (
      <main className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-xl font-bold tracking-tight">🗺️ Carte</h1>
          <div className="mt-6 bg-red-900/40 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">
              Impossible de charger les cartes
            </p>
            <p className="text-sm text-gray-400 mt-1">
              L&apos;API publique Artifacts MMO est injoignable.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const layers = extractLayers(maps);
  const activeLayer = layers.includes(layer ?? "") ? layer! : layers[0];

  const layerMaps = maps.filter((m) => m.layer === activeLayer);
  const lookup = buildMapLookup(layerMaps);
  const bounds = computeBounds(layerMaps);
  const tileContents = await resolveTileContents(layerMaps);

  const columns = bounds.maxX - bounds.minX + 1;
  const rows: number[] = [];
  for (let y = bounds.minY; y <= bounds.maxY; y++) rows.push(y);
  const cols: number[] = [];
  for (let x = bounds.minX; x <= bounds.maxX; x++) cols.push(x);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold tracking-tight">🗺️ Carte</h1>

          {/* Sélecteur de layer — liens serveur, pas de JS client */}
          <div className="flex gap-1 rounded-lg bg-gray-900 p-1">
            {layers.map((l) => (
              <Link
                key={l}
                href={`/map?layer=${l}`}
                aria-current={l === activeLayer ? "page" : undefined}
                className={`rounded-md px-3 py-1 text-sm transition-colors ${
                  l === activeLayer
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {layerLabel(l)}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-500">
          {layerMaps.length} cases · survolez une case pour voir son contenu
        </p>

        <div className="overflow-auto rounded-xl border border-gray-800 bg-gray-900/40 p-4">
          <div className="relative inline-block">
            <div
              className="inline-grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${columns}, 3.5rem)` }}
            >
              {rows.map((y) =>
                cols.map((x) => {
                  const map = lookup.get(`${activeLayer}:${x}:${y}`) ?? null;
                  if (!map) {
                    // Trou dans le monde : cellule vide transparente.
                    return <div key={`${x}:${y}`} className="h-14 w-14" />;
                  }

                  const content = map.interactions?.content;

                  return (
                    <MapTile
                      key={`${x}:${y}`}
                      map={map}
                      size="lg"
                      content={
                        content
                          ? tileContents[
                              tileContentKey(content.type, content.code)
                            ]
                          : undefined
                      }
                    />
                  );
                }),
              )}
            </div>
            {/* Marqueurs personnages en calque absolu — positions live via WSS */}
            <MapCharacterMarkers
              initialCharacters={characters}
              activeLayer={activeLayer}
              minX={bounds.minX}
              minY={bounds.minY}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
