import { ArtifactsCharacter } from "@/types/character";
import { BankDetails, BankItem } from "@/types/bank";
import { GatheringTaskStatus } from "@/types/gathering";
import { ArtifactsMap } from "@/types/map";
import { MonsterData, ResourceData } from "@/types/tile-content";

// `API_URL` est lue à l'exécution (configurable au runtime Docker), car
// l'appel ne se fait que côté serveur. `NEXT_PUBLIC_API_URL` reste un fallback
// pour la compatibilité (valeur figée au build).
const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8888";

// Revalidation à 60 s (et non 10 s) : chaque rendu appelle CharacterController,
// qui interroge l'API Artifacts en amont — quota 2000 req/h partagé avec le bot.
export async function fetchCharacters(): Promise<ArtifactsCharacter[]> {
  const response = await fetch(`${API_BASE}/characters`, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function fetchObjectives(): Promise<Record<string, string>> {
  const response = await fetch(`${API_BASE}/characters/objectives`, {
    next: { revalidate: 60 },
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

/**
 * Détail d'une ressource publique (skill, niveau, drops) pour les tooltips.
 * Cache très long (24 h) : données statiques hors patch du jeu. `null` en cas
 * d'erreur — le tooltip est un enrichissement, jamais bloquant.
 */
export async function fetchResource(code: string): Promise<ResourceData | null> {
  return fetchPublicDetail(`/resources/${code}`);
}

/** Détail d'un monstre public (niveau, HP, drops) — mêmes règles que fetchResource. */
export async function fetchMonster(code: string): Promise<MonsterData | null> {
  return fetchPublicDetail(`/monsters/${code}`);
}

async function fetchPublicDetail<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${ARTIFACTS_PUBLIC_API}${path}`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return null;
    }

    const body: { data: T } = await response.json();

    // Réponse dégradée (rate limit ou erreur upstream renvoyée en 200) : la
    // mettre en cache sous forme de crash a déjà cassé /map — on la rejette.
    if (typeof body?.data !== "object" || body.data === null) {
      return null;
    }

    return body.data;
  } catch {
    return null;
  }
}
