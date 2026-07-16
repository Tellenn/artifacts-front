import { fetchAllMaps, fetchCharacters, fetchObjectives } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";
import { ArtifactsCharacter } from "@/types/character";
import { ArtifactsMap } from "@/types/map";
import { buildMapLookup, getNeighborhood } from "@/lib/maps";
import { resolveTileContents } from "@/lib/tile-content";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let characters: ArtifactsCharacter[] = [];
  let objectives: Record<string, string> = {};
  let maps: ArtifactsMap[] = [];
  let error: string | null = null;

  try {
    [characters, objectives, maps] = await Promise.all([
      fetchCharacters(),
      fetchObjectives().catch(() => ({} as Record<string, string>)),
      fetchAllMaps(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  const mapLookup = buildMapLookup(maps);
  const neighborhoods = new Map(
    characters.map((char) => [
      char.name,
      getNeighborhood(mapLookup, char.x, char.y, char.layer),
    ]),
  );
  const tileContents = await resolveTileContents(
    [...neighborhoods.values()].flat(),
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        <h1 className="text-xl font-bold tracking-tight">⚔️ Personnages</h1>
        {error ? (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-6 text-center">
            <p className="text-red-400 font-medium">Impossible de contacter le backend</p>
            <p className="text-sm text-gray-400 mt-1">{error}</p>
            <p className="text-xs text-gray-500 mt-3">Vérifiez que le serveur tourne sur localhost:8888</p>
          </div>
        ) : characters.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">Aucun personnage trouvé.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {characters.map((char) => (
              <CharacterCard
                key={char.name}
                character={char}
                objective={objectives[char.name]}
                neighborhood={neighborhoods.get(char.name) ?? []}
                tileContents={tileContents}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
