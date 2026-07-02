import { ArtifactsCharacter } from "@/types/character";

// `API_URL` est lue à l'exécution (configurable au runtime Docker), car
// l'appel ne se fait que côté serveur. `NEXT_PUBLIC_API_URL` reste un fallback
// pour la compatibilité (valeur figée au build).
const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8888";

export async function fetchCharacters(): Promise<ArtifactsCharacter[]> {
  const response = await fetch(`${API_BASE}/characters`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchObjectives(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE}/characters/objectives`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
