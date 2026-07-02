import { fetchCharacters, fetchObjectives } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";
import { ArtifactsCharacter } from "@/types/character";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let characters: ArtifactsCharacter[] = [];
  let objectives: Record<string, string> = {};
  let error: string | null = null;

  try {
    [characters, objectives] = await Promise.all([
      fetchCharacters(),
      fetchObjectives().catch(() => ({} as Record<string, string>)),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          ⚔️ Artifacts MMO — Dashboard
        </h1>
        <span className="text-xs text-gray-500">Actualisé toutes les 10s</span>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
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
              <CharacterCard key={char.name} character={char} objective={objectives[char.name]} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
