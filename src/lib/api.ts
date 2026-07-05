import { ArtifactsCharacter } from "@/types/character";
import { BankDetails, BankItem } from "@/types/bank";
import { GatheringTaskStatus } from "@/types/gathering";
import { ArtifactsMap } from "@/types/map";

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

export async function fetchBankItems(): Promise<BankItem[]> {
  const response = await fetch(`${API_BASE}/bank/items`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchBankDetails(): Promise<BankDetails> {
  const response = await fetch(`${API_BASE}/bank/details`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchGatheringTasks(): Promise<GatheringTaskStatus[]> {
  const response = await fetch(`${API_BASE}/gathering-tasks`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// L'API publique Artifacts MMO est distincte du backend : elle sert les
// données de cartes (statiques) sans authentification.
const ARTIFACTS_PUBLIC_API = "https://api.artifactsmmo.com";

interface MapsPage {
  data: ArtifactsMap[];
  pages: number;
}

/**
 * Récupère toutes les cartes du jeu (~1428, paginées par 100).
 * Cache long (1 h) : les cartes sont quasi statiques.
 * Retourne [] en cas d'erreur — la mini-carte est un enrichissement,
 * le dashboard doit s'afficher sans elle.
 */
export async function fetchAllMaps(): Promise<ArtifactsMap[]> {
  try {
    const maps: ArtifactsMap[] = [];
    let page = 1;
    let pages = 1;

    do {
      const response = await fetch(
        `${ARTIFACTS_PUBLIC_API}/maps?size=100&page=${page}`,
        { next: { revalidate: 3600 } },
      );

      if (!response.ok) {
        throw new Error(`Erreur API maps: ${response.status} ${response.statusText}`);
      }

      const body: MapsPage = await response.json();
      maps.push(...body.data);
      pages = body.pages;
      page++;
    } while (page <= pages);

    return maps;
  } catch {
    return [];
  }
}
