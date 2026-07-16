"use client";

export default function MapError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-xl font-bold tracking-tight">🗺️ Carte</h1>
        <div className="mt-6 bg-red-900/40 border border-red-700 rounded-xl p-6 text-center">
          <p className="text-red-400 font-medium">
            La carte n&apos;a pas pu être affichée
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Erreur inattendue pendant le rendu — probablement une réponse
            dégradée de l&apos;API publique Artifacts MMO.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-gray-800 px-4 py-1.5 text-sm text-white hover:bg-gray-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    </main>
  );
}
