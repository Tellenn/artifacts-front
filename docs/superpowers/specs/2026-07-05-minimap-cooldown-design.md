# Mini-map + compte à rebours de cooldown dans la carte personnage

**Date :** 2026-07-05
**Statut :** validé (brainstorming)

## Objectif

Dans chaque tuile personnage du dashboard (`CharacterCard`) :

1. Afficher une **mini-carte 3×3** : la carte où se trouve le personnage au centre
   (mise en évidence), entourée des 8 cartes adjacentes, en miniature.
2. Afficher le **temps restant de cooldown en secondes**, décompté en direct
   côté client.

## Contexte

- Le backend `artifacts-client` n'expose pas d'endpoint `/maps`.
- L'API publique Artifacts MMO (`GET https://api.artifactsmmo.com/maps`) est
  accessible sans authentification et retourne ~1428 cartes (`map_id`, `name`,
  `skin`, `x`, `y`, `layer`, `access`, `interactions`), paginées (`size` max 100).
- Chaque coordonnée (x, y) existe sur 3 layers (`overworld`, `underground`,
  `interior`) ; `ArtifactsCharacter.layer` donne le layer courant du personnage.
- Les images de cartes sont servies par
  `https://artifactsmmo.com/images/maps/[skin].png`.

## Décisions de design

### Source des données cartes — API publique, côté serveur, cachée

Option retenue parmi :

1. **API publique Artifacts, fetch serveur, cache long** ✅ — pas de
   modification backend, données statiques, 15 requêtes paginées max une fois
   par heure (cache Next `revalidate: 3600`).
2. Appels par coordonnée (9 par personnage) — rejeté : plus de requêtes pour
   aucun bénéfice.
3. Nouvel endpoint dans `artifacts-client` — rejeté : second repo à modifier
   pour des données déjà publiques.

### Layout — grille 3×3 dans la ligne « position »

La mini-carte (tuiles ~28 px) s'insère dans la ligne position existante de la
carte, à gauche de `📍 (x, y)` et du cooldown. Choix validé par l'utilisateur
face à une section pleine largeur ou une bande horizontale 3×1.

## Architecture

### Données

- **`src/types/map.ts`** — interface `ArtifactsMap` : `map_id`, `name`, `skin`,
  `x`, `y`, `layer`, `access` (avec `access.type`). Champs en snake_case
  conformes au JSON de l'API publique (seul `map_id` est multi-mots parmi les
  champs utilisés).
- **`src/lib/api.ts`** — `fetchAllMaps(): Promise<ArtifactsMap[]>` :
  - pagine `https://api.artifactsmmo.com/maps?size=100&page=n` jusqu'à `pages` ;
  - `next: { revalidate: 3600 }` (cartes quasi statiques) ;
  - en cas d'erreur : retourne `[]` — le dashboard s'affiche sans mini-cartes,
    pas de crash.
- **`src/lib/maps.ts`** — helpers purs :
  - `buildMapLookup(maps)` → `Map<string, ArtifactsMap>` clé `"{layer}:{x}:{y}"` ;
  - `getNeighborhood(lookup, x, y, layer)` → tableau de 9 entrées
    (`ArtifactsMap | null`), ordre ligne par ligne (nord-ouest → sud-est),
    `null` quand la carte n'existe pas (bord du monde).

### UI

- **`src/components/MiniMap.tsx`** (Server Component) :
  - props : `neighborhood: (ArtifactsMap | null)[]` (9 entrées) ;
  - grille CSS 3×3, tuiles ~28 px, `<img>` vers
    `https://artifactsmmo.com/images/maps/[skin].png` ;
  - tuile centrale : ring amber (personnage ici) ;
  - carte absente : cellule sombre vide (`bg-gray-800`) ;
  - carte à accès bloqué (`access.type === "blocked"`) : atténuée (`opacity-50`).
  - Vérifier la doc Next 16 (`node_modules/next/dist/docs/`) avant d'écrire :
    `<img>` simple vs `next/image` + `remotePatterns`.
- **`src/components/CooldownTimer.tsx`** (Client Component — interactivité
  réelle justifiée) :
  - props : `expiration: string | null` ;
  - calcule les secondes restantes, `setInterval` 1 s, affiche `⏳ Ns` en orange ;
  - n'affiche rien si `null` ou expiré — la visibilité est décidée côté client,
    ce qui corrige l'affichage périmé actuel calculé côté serveur ;
  - anti-mismatch d'hydratation : monte vide, n'affiche qu'après le premier
    tick client (`useEffect`). `AutoRefresh` rafraîchit les données toutes
    les 10 s.
- **`src/components/CharacterCard.tsx`** :
  - la ligne position accueille `MiniMap` à gauche de `📍 (x, y)` ;
  - le badge statique `⏳ Cooldown` (et le calcul `isOnCooldown`) est remplacé
    par `<CooldownTimer expiration={character.cooldown_expiration} />`.
- **`src/app/page.tsx`** :
  - `Promise.all([fetchCharacters(), fetchObjectives(), fetchAllMaps()])` ;
  - construit le lookup une fois, passe à chaque `CharacterCard` sa
    `neighborhood` (calculée via `getNeighborhood`).

## Hors périmètre

- Page détail personnage (`/characters/[name]`) — non demandée (« tile »).
- Navigation/interaction sur la mini-carte (tooltips, liens).
- Endpoint backend `/maps`.

## Gestion d'erreur

- API maps injoignable → `fetchAllMaps` retourne `[]` → `getNeighborhood`
  retourne 9 × `null` → `MiniMap` affiche 9 cellules sombres (ou est masquée
  si tout est `null` — au choix de l'implémentation, préférer masquer).
- Image de skin 404 → comportement natif `<img>` (alt vide, cellule sombre en
  fond) ; pas de logique dédiée.

## Tests / validation

- `npm run build` sans erreur TypeScript.
- Dashboard avec backend up : mini-cartes visibles, centre en surbrillance,
  décompte qui tombe à 0 puis disparaît.
- Dashboard avec backend down : page d'erreur habituelle inchangée.
- API publique down (simulable en coupant le réseau) : cartes personnages
  intactes, sans mini-carte.
