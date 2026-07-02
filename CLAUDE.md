@AGENTS.md

# Agent Next.js — Artifacts Front

Tu es un expert en développement Next.js et TypeScript, spécialisé dans le Software Craftsmanship.
Ce projet est le frontend de visualisation des personnages Artifacts MMO,
qui consomme l'API Spring Boot du projet `artifacts-client`.

---

## Stack & Versions

- **Next.js** 16 (App Router, Server Components par défaut)
- **TypeScript** strict
- **Tailwind CSS** v4
- **React** 19
- **Node.js** / npm

**Port de dev :** `3000`
**Backend :** Spring Boot sur `http://localhost:8888`

---

## Architecture

```
src/
├── app/                          → Pages (App Router)
│   ├── layout.tsx                → Layout racine (HTML, fonts, metadata)
│   ├── page.tsx                  → Dashboard — grille des 5 personnages
│   └── characters/[name]/
│       └── page.tsx              → Page détail d'un personnage
├── components/                   → Composants UI réutilisables
│   └── CharacterCard.tsx         → Carte résumé d'un personnage
├── lib/
│   └── api.ts                    → Fonctions fetch vers le backend (localhost:8888)
└── types/
    └── character.ts              → Types TypeScript + métadonnées des personnages
```

---

## Conventions TypeScript / React

### Style général

- **TypeScript strict** — pas de `any`, pas d'assertions `as Type` non justifiées.
- Préfère les **interfaces** pour les shapes d'objets, les **types** pour les unions.
- Toujours typer explicitement les props des composants avec une `interface` locale.
- Utilise les **Server Components** par défaut (pas de `"use client"` sauf besoin d'interactivité).
- Pas de `useState` / `useEffect` dans les pages — les données viennent du serveur.

### Nommage

- Composants : `PascalCase` (fichier + export)
- Fonctions utilitaires / hooks : `camelCase`
- Types / Interfaces : `PascalCase`
- Constantes : `SCREAMING_SNAKE_CASE`
- Fichiers de pages : `page.tsx` (convention Next.js App Router)
- Fichiers de composants : `NomDuComposant.tsx`

### Composants

```tsx
// Bien — interface locale + props explicites
interface CharacterCardProps {
  character: ArtifactsCharacter;
}

export function CharacterCard({ character }: CharacterCardProps) {
  // ...
}

// Éviter — props implicites ou any
export function CharacterCard(props: any) { ... }
```

### Server Components (pages)

- Les pages sont `async` et fetchent directement les données.
- Gestion d'erreur avec `try/catch` — affiche un message clair, pas de crash.
- `export const dynamic = "force-dynamic"` sur les pages qui lisent des données en temps réel.

```tsx
export const dynamic = "force-dynamic";

export default async function MyPage() {
  let data: MyType[] = [];
  let error: string | null = null;

  try {
    data = await fetchSomething();
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  // render...
}
```

---

## Conventions Next.js App Router

### Routes

| Route | Fichier | Description |
|-------|---------|-------------|
| `/` | `app/page.tsx` | Dashboard — tous les personnages |
| `/characters/[name]` | `app/characters/[name]/page.tsx` | Détail d'un personnage |

### Params de route dynamique (Next.js 15+)

Les `params` sont une **Promise** — toujours les `await` :

```tsx
interface PageProps {
  params: Promise<{ name: string }>;
}

export default async function Page({ params }: PageProps) {
  const { name } = await params;
  // ...
}
```

### Navigation

- Utilise `<Link href="...">` de `next/link` pour la navigation interne.
- Utilise `notFound()` de `next/navigation` pour les ressources introuvables.

---

## Couche API (`src/lib/api.ts`)

- Une fonction par endpoint backend.
- Gère le `revalidate` pour le cache Next.js.
- Lance une erreur typée en cas de réponse non-ok.
- L'URL de base est lue côté serveur via `API_URL` (configurable au runtime, ex. Docker), avec fallback sur `NEXT_PUBLIC_API_URL` (`.env.local`) puis `http://localhost:8888`.

```ts
export async function fetchCharacters(): Promise<ArtifactsCharacter[]> {
  const response = await fetch(`${API_BASE}/characters`, {
    next: { revalidate: 10 },
  });

  if (!response.ok) {
    throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
```

---

## Types (`src/types/character.ts`)

- Miroir des modèles Kotlin du backend `artifacts-client`.
- `ArtifactsCharacter` — shape complète retournée par `GET /characters`.
- `CHARACTER_META` — map `name → { role, skin }` pour les 5 personnages connus.
- `ROLE_LABELS` / `ROLE_COLORS` — affichage Tailwind par rôle.

**Personnages connus :**

| Nom | Rôle | Skin |
|-----|------|------|
| Renoir | crafter | men1 |
| Cloud | fighter | men2 |
| Aerith | alchemist | women1 |
| Kepo | miner | women2 |
| Gustave | woodworker | men3 |

---

## Tailwind CSS

- Thème sombre (`bg-gray-950`, `bg-gray-900`, `border-gray-700`) par défaut.
- Pas de classes utilitaires inline arbitraires — préfère les classes Tailwind existantes.
- Pas de `style={{}}` sauf pour les valeurs dynamiques (ex. `width: \`${pct}%\``).
- Les couleurs sémantiques par rôle sont définies dans `ROLE_COLORS` (pas de classes en dur dans les composants).

---

## Ce qu'il faut éviter

- `"use client"` inutile — les Server Components suffisent pour la lecture de données.
- `any` comme type — toujours typer explicitement.
- Logique métier dans les composants — déléguer à `lib/api.ts` ou des helpers.
- Fetch côté client (`useEffect + fetch`) si un Server Component suffit.
- Dupliquer les types — mettre à jour `types/character.ts` si le backend évolue.
- Hardcoder `http://localhost:8888` — utiliser `API_URL` / `NEXT_PUBLIC_API_URL`.

---

## Variables d'environnement

| Variable | Valeur par défaut | Description |
|----------|-------------------|-------------|
| `API_URL` | `http://localhost:8888` | URL du backend Spring Boot, lue **au runtime** côté serveur (à privilégier pour Docker). |
| `NEXT_PUBLIC_API_URL` | — | Fallback figé **au build** (`.env.local`). Utile en dev local. |

Fichier `.env.local` à la racine (non commité).

> ⚠️ Les variables `NEXT_PUBLIC_*` sont inlinées au build et **non** modifiables au runtime du conteneur. L'appel backend étant uniquement côté serveur, `API_URL` (sans préfixe) est lue à l'exécution et reste surchargeable via `docker run -e API_URL=...`. Ordre de résolution dans `api.ts` : `API_URL` → `NEXT_PUBLIC_API_URL` → `http://localhost:8888`.

---

## Commandes utiles

```bash
npm run dev      # Serveur de développement sur :3000
npm run build    # Build de production (vérifie TypeScript)
npm run lint     # ESLint
```

---

## Docker

L'image utilise la sortie `output: "standalone"` de Next.js (serveur autonome,
sans `node_modules`). Le `Dockerfile` est multi-étapes (`deps` → `builder` →
`runner`) et tourne en utilisateur non-root.

```bash
docker build -t artifacts-front .

# Backend sur la machine hôte (Docker Desktop) :
docker run -p 3000:3000 -e API_URL=http://host.docker.internal:8888 artifacts-front

# Backend dans un autre service (réseau Docker partagé) :
docker run -p 3000:3000 -e API_URL=http://backend:8888 artifacts-front
```

> `localhost` dans le conteneur désigne le conteneur lui-même : pour joindre un
> backend tournant sur l'hôte, utiliser `host.docker.internal` (Docker Desktop)
> ou le nom du service sur le réseau Docker.

---

## Checklist avant chaque modification

1. Le composant est-il un Server Component (pas de state côté client inutile) ?
2. Les props sont-elles typées avec une interface explicite ?
3. Les données sont-elles fetchées dans `lib/api.ts`, pas directement dans le composant ?
4. Pas de `any` dans le code ajouté ?
5. Le build `npm run build` passe-t-il sans erreur TypeScript ?
6. L'affichage fonctionne-t-il si le backend est indisponible (gestion d'erreur) ?
