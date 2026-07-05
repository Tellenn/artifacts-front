# Mini-map 3×3 + Cooldown Countdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a 3×3 mini-map (current map centered + 8 neighbors) and a live cooldown countdown in each dashboard character tile.

**Architecture:** Map data comes from the public Artifacts MMO API (`https://api.artifactsmmo.com/maps`), fetched server-side in `lib/api.ts` with a 1 h Next cache, turned into a `(layer, x, y)` lookup by pure helpers in `lib/maps.ts`. The dashboard page passes each card its 9-tile neighborhood; a server `MiniMap` component renders the grid, and a small client `CooldownTimer` component ticks the remaining seconds.

**Tech Stack:** Next.js 16 (App Router, Server Components), React 19, TypeScript strict, Tailwind CSS v4.

**Spec:** `docs/superpowers/specs/2026-07-05-minimap-cooldown-design.md`

## Global Constraints

- TypeScript strict — no `any`, no unjustified `as` assertions.
- Props typed with a local `interface` per component.
- Server Components by default; `"use client"` only for the cooldown timer (real interactivity).
- Data fetching lives in `src/lib/api.ts`, never in components.
- Map images: `https://artifactsmmo.com/images/maps/[skin].png` (~2 KB each) — use plain `<img>` with an inline eslint suppression; `next/image` + `remotePatterns` is deliberate overkill for 28 px tiles (decision validated against `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`).
- `next: { revalidate: 3600 }` for map data (confirmed valid in Next 16 docs, `04-functions/fetch.md`).
- No test runner exists in this project (see `package.json`) — the validation gate per spec and project checklist is `npm run build` + `npm run lint` + visual verification. Do not introduce a test framework.
- UI copy is in French (match existing components).
- Verification commands: `npm run build` must pass with zero TypeScript errors; `npm run lint` must not report errors in changed files.

---

### Task 1: Map type + `fetchAllMaps` in the API layer

**Files:**
- Create: `src/types/map.ts`
- Modify: `src/lib/api.ts` (append at end)

**Interfaces:**
- Consumes: nothing new.
- Produces: `ArtifactsMap` interface (`map_id: number`, `name: string`, `skin: string`, `x: number`, `y: number`, `layer: string`, `access: MapAccess | null`) and `fetchAllMaps(): Promise<ArtifactsMap[]>`.

The public API JSON is snake_case (e.g. `map_id`) — the interface mirrors the JSON exactly, like `ArtifactsCharacter` does. Sample response element:

```json
{"map_id":1,"name":"Forest","skin":"forest_3","x":-5,"y":-5,"layer":"overworld","access":{"type":"standard","conditions":[]},"interactions":{"content":null,"transition":null}}
```

We only type the fields we consume; extra JSON fields are ignored at runtime.

- [ ] **Step 1: Create `src/types/map.ts`**

```ts
// Miroir partiel du JSON de l'API publique Artifacts MMO (GET /maps).
// Snake_case conforme au JSON réel ; seuls les champs consommés sont typés.

export interface MapAccess {
  type: string;
}

export interface ArtifactsMap {
  map_id: number;
  name: string;
  skin: string;
  x: number;
  y: number;
  layer: string;
  access: MapAccess | null;
}
```

- [ ] **Step 2: Add `fetchAllMaps` to `src/lib/api.ts`**

Add the import at the top of the file, alongside the existing type imports:

```ts
import { ArtifactsMap } from "@/types/map";
```

Append at the end of the file:

```ts
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
```

- [ ] **Step 3: Verify the build passes**

Run: `npm run build`
Expected: build completes with no TypeScript errors (new code is not used yet — that is fine, it must still compile).

- [ ] **Step 4: Commit**

```bash
git add src/types/map.ts src/lib/api.ts
git commit -m "feat(maps): type ArtifactsMap + fetchAllMaps via l'API publique (cache 1h)"
```

---

### Task 2: Lookup + neighborhood helpers

**Files:**
- Create: `src/lib/maps.ts`

**Interfaces:**
- Consumes: `ArtifactsMap` from `@/types/map` (Task 1).
- Produces:
  - `type MapLookup = Map<string, ArtifactsMap>`
  - `buildMapLookup(maps: ArtifactsMap[]): MapLookup`
  - `getNeighborhood(lookup: MapLookup, x: number, y: number, layer: string): (ArtifactsMap | null)[]` — always exactly 9 entries, row by row from north-west to south-east; `null` where no map exists.

Coordinate convention: in Artifacts MMO, **north is `y - 1`** (y grows southward). The first returned row is `y - 1`, the last is `y + 1`.

- [ ] **Step 1: Create `src/lib/maps.ts`**

```ts
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
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/maps.ts
git commit -m "feat(maps): lookup (layer,x,y) et voisinage 3x3 d'une position"
```

---

### Task 3: `MiniMap` server component

**Files:**
- Create: `src/components/MiniMap.tsx`

**Interfaces:**
- Consumes: `ArtifactsMap` from `@/types/map` (Task 1).
- Produces: `MiniMap({ neighborhood }: { neighborhood: (ArtifactsMap | null)[] })` — server component; renders `null` when every entry is `null` (maps API unreachable), per spec.

Rendering rules (from spec): 3×3 grid of 28 px tiles (`w-7 h-7`), center tile (index 4) gets an amber ring, missing maps are dark empty cells, blocked-access maps (`access.type === "blocked"`) are dimmed.

- [ ] **Step 1: Create `src/components/MiniMap.tsx`**

```tsx
import { ArtifactsMap } from "@/types/map";

interface MiniMapProps {
  /** 9 cartes (3×3), du nord-ouest au sud-est ; la case 4 est la position courante. */
  neighborhood: (ArtifactsMap | null)[];
}

export function MiniMap({ neighborhood }: MiniMapProps) {
  // API maps injoignable : pas de données du tout → on masque la mini-carte.
  if (neighborhood.every((map) => map === null)) {
    return null;
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 shrink-0">
      {neighborhood.map((map, i) => {
        const highlight = i === 4 ? "ring-2 ring-amber-400" : "";

        if (!map) {
          return <div key={i} className={`w-7 h-7 rounded-sm bg-gray-800 ${highlight}`} />;
        }

        const blocked = map.access?.type === "blocked";

        return (
          <div key={i} className={`w-7 h-7 rounded-sm overflow-hidden bg-gray-800 ${highlight}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tuiles statiques ~2 Ko, next/image superflu */}
            <img
              src={`https://artifactsmmo.com/images/maps/${map.skin}.png`}
              alt={map.name}
              loading="lazy"
              className={`h-full w-full object-cover ${blocked ? "opacity-40" : ""}`}
            />
          </div>
        );
      })}
    </div>
  );
}
```

Note: `key={i}` is acceptable here — the list is a fixed-size positional grid, never reordered.

- [ ] **Step 2: Verify build and lint pass**

Run: `npm run build` then `npm run lint`
Expected: no TypeScript errors; no lint errors (the `no-img-element` warning is suppressed inline).

- [ ] **Step 3: Commit**

```bash
git add src/components/MiniMap.tsx
git commit -m "feat(ui): composant MiniMap 3x3 (position courante en surbrillance)"
```

---

### Task 4: `CooldownTimer` client component

**Files:**
- Create: `src/components/CooldownTimer.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: `CooldownTimer({ expiration }: { expiration: string | null })` — client component; renders `⏳ Ns` (orange, `ml-auto`) while the cooldown runs, `null` otherwise.

Hydration safety (from spec): state starts at `null`, so server render and first client render both produce nothing; the countdown appears after the mount effect runs. Visibility is decided entirely client-side, which fixes the current stale server-side `isOnCooldown`.

- [ ] **Step 1: Create `src/components/CooldownTimer.tsx`**

```tsx
"use client";

import { useEffect, useState } from "react";

interface CooldownTimerProps {
  /** Date ISO d'expiration du cooldown, ou null si aucun. */
  expiration: string | null;
}

function secondsLeft(expiration: string): number {
  return Math.max(0, Math.ceil((new Date(expiration).getTime() - Date.now()) / 1000));
}

export function CooldownTimer({ expiration }: CooldownTimerProps) {
  // null jusqu'au montage : le rendu serveur et la première hydratation
  // n'affichent rien, ce qui évite tout mismatch d'horloge serveur/client.
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (expiration === null) {
      setRemaining(null);
      return;
    }

    const update = () => setRemaining(secondsLeft(expiration));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiration]);

  if (remaining === null || remaining <= 0) {
    return null;
  }

  return <span className="ml-auto font-medium text-orange-400">⏳ {remaining}s</span>;
}
```

- [ ] **Step 2: Verify the build passes**

Run: `npm run build`
Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/CooldownTimer.tsx
git commit -m "feat(ui): compte a rebours de cooldown cote client"
```

---

### Task 5: Wire into `CharacterCard` and the dashboard page

**Files:**
- Modify: `src/components/CharacterCard.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `MiniMap` (Task 3), `CooldownTimer` (Task 4), `fetchAllMaps` (Task 1), `buildMapLookup` / `getNeighborhood` (Task 2), `ArtifactsMap` (Task 1).
- Produces: `CharacterCardProps` gains `neighborhood: (ArtifactsMap | null)[]`.

- [ ] **Step 1: Update `src/components/CharacterCard.tsx`**

Add imports after the existing ones:

```tsx
import { ArtifactsMap } from "@/types/map";
import { MiniMap } from "@/components/MiniMap";
import { CooldownTimer } from "@/components/CooldownTimer";
```

Extend the props interface:

```tsx
interface CharacterCardProps {
  character: ArtifactsCharacter;
  objective?: string;
  neighborhood: (ArtifactsMap | null)[];
}

export function CharacterCard({ character, objective, neighborhood }: CharacterCardProps) {
```

Delete the now-unused `isOnCooldown` computation (lines 38–40 in the current file):

```tsx
  const isOnCooldown =
    character.cooldown_expiration != null &&
    new Date(character.cooldown_expiration) > new Date();
```

Replace the whole `{/* Position */}` block:

```tsx
        {/* Position */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>📍</span>
          <span>
            ({character.x}, {character.y})
          </span>
          {isOnCooldown && (
            <span className="ml-auto text-orange-400 font-medium">⏳ Cooldown</span>
          )}
        </div>
```

with:

```tsx
        {/* Position + mini-carte */}
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <MiniMap neighborhood={neighborhood} />
          <span>
            📍 ({character.x}, {character.y})
          </span>
          <CooldownTimer expiration={character.cooldown_expiration} />
        </div>
```

- [ ] **Step 2: Update `src/app/page.tsx`**

Replace the full file with:

```tsx
import { fetchAllMaps, fetchCharacters, fetchObjectives } from "@/lib/api";
import { CharacterCard } from "@/components/CharacterCard";
import { ArtifactsCharacter } from "@/types/character";
import { ArtifactsMap } from "@/types/map";
import { buildMapLookup, getNeighborhood } from "@/lib/maps";

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
                neighborhood={getNeighborhood(mapLookup, char.x, char.y, char.layer)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
```

Note: `fetchAllMaps` already returns `[]` on failure, so it never rejects the `Promise.all` — no extra `.catch` needed.

- [ ] **Step 3: Verify build and lint pass**

Run: `npm run build` then `npm run lint`
Expected: no TypeScript errors, no lint errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CharacterCard.tsx src/app/page.tsx
git commit -m "feat(dashboard): mini-carte 3x3 et decompte de cooldown dans les tuiles"
```

---

### Task 6: Visual verification

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Start the dev server with the backend running**

Run: `npm run dev` (backend Spring Boot must be up on `localhost:8888`).
Open `http://localhost:3000`.

Expected, per card:
- a 3×3 grid of map tiles left of `📍 (x, y)`, center tile with an amber ring;
- the center tile's terrain matches where that character actually stands (spot-check one character against `https://artifactsmmo.com/images/maps/[skin].png` for its coordinates);
- **orientation check:** the tile north of the character (y − 1) renders on the TOP row. If the grid appears vertically flipped, invert the `dy` loop direction in `getNeighborhood` (`for (let dy = 1; dy >= -1; dy--)`) — coordinate convention is the one empirically observable in game;
- edge-of-world neighbors render as dark empty cells;
- a character on cooldown shows `⏳ Ns` counting down each second, disappearing at 0, reappearing after the next action (AutoRefresh re-fetches every 10 s).

- [ ] **Step 2: Verify degraded mode (maps API down)**

Simulate by temporarily changing `ARTIFACTS_PUBLIC_API` in `src/lib/api.ts` to an unreachable host (e.g. `https://api.artifactsmmo.invalid`), reload the dashboard.
Expected: cards render normally with **no** mini-map and no error. Revert the change afterwards (`git checkout -- src/lib/api.ts`).

- [ ] **Step 3: Final gate**

Run: `npm run build` and `npm run lint`
Expected: both clean. Working tree contains only the planned commits.
