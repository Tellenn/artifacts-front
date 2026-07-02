# UI Artifacts — complétion du dashboard (banque, tâches, mobile, CI/CD)

**Date :** 2026-07-02
**Repos concernés :** `artifacts-front` (principal), `artifacts-client` (endpoints + compose)

## Contexte

Le front Next.js 16 affiche déjà le dashboard des 5 personnages et une page détail.
Il manque : la consultation de la banque, la vue des tâches du pool de récolte,
une navigation utilisable sur mobile, et un déploiement automatisé.

Décisions prises (options recommandées, utilisateur AFK lors du questionnaire) :
- Déploiement : Docker Hub + runner self-hosted, même pattern que le backend.
- Repo GitHub front : nouveau repo à créer par l'utilisateur (workflow prêt, secrets à ajouter).
- Banque : liste + recherche + filtres par type, avec or/slots en en-tête.
- Tâches : pool de récolte (`GET /gathering-tasks`) + tâche de jeu de chaque personnage.

## Backend (`artifacts-client`)

1. **Commit du travail gathering en attente** (branche `feat/crafter-batch-leveling`) :
   `GatheringTaskController` (`GET /gathering-tasks`), `GatheringTaskStatus`,
   modifications de `GatheringTaskService` + test. Précondition : `./mvnw test` vert.
2. **Nouveau `BankController`** (lecture seule, délègue à `BankService`) :
   - `GET /bank/items` → `List<BankItemDocument>` (JSON camelCase : code, name, type,
     subtype, level, quantity, effects, craft…) via nouvelle méthode `BankService.getAllItems()`.
   - `GET /bank/details` → `BankDetails` (JSON snake_case : `gold`, `next_expansion_cost`,
     `expansions`, `slots`) — appel live à l'API du jeu.
   Pas de CORS à ajouter : le front fetch côté serveur (Server Components).
3. **`docker-compose.yml`** : réseau `tellenn-network` avec `name:` explicite
   (référençable en `external` depuis le compose du front) ; le service `ui`
   est retiré — il est désormais déployé par le repo front.

## Frontend (`artifacts-front`)

### Nouvelles routes

| Route | Contenu |
|-------|---------|
| `/bank` | En-tête or / slots / expansions, recherche par nom/code, filtre par type, grille des items avec quantités |
| `/tasks` | Cartes du pool de récolte (progression, restant, réservations par personnage) + section « tâches de jeu » par personnage (`task`, `taskProgress/taskTotal`) |

### Composants

- `NavBar` (client, `usePathname`) : barre supérieure sur desktop, **tab bar fixée en bas
  sur mobile** (Dashboard / Banque / Tâches). Ajoutée dans `layout.tsx`.
- `AutoRefresh` (client) : `router.refresh()` toutes les 10 s — rend réel le libellé
  « Actualisé toutes les 10s » sans polling client vers l'API (le fetch reste serveur).
- `BankBrowser` (client) : recherche + filtres côté client sur la liste passée en props.
- Pages `/bank` et `/tasks` : Server Components `force-dynamic`, même gestion d'erreur
  que le dashboard (panneau rouge si backend injoignable).

### Types

- `types/bank.ts` : `BankItem` (camelCase, miroir de `BankItemDocument`), `BankDetails`
  (snake_case, miroir du modèle Kotlin annoté `@JsonProperty`).
- `types/gathering.ts` : `GatheringTaskStatus`, `ReservationStatus` (camelCase).
- **Découverte en vérification** : `ArtifactsCharacter` sérialise en **snake_case**
  (annotations `@param:JsonProperty` champ par champ) alors que le type front
  existant était en camelCase — le dashboard affichait `undefined` pour `max_hp`,
  `task_progress`, les niveaux de compétence, etc. Correction incluse :
  `types/character.ts` réécrit en miroir du JSON réel + usages mis à jour.

### Mobile

- Tab bar en bas d'écran (`md:hidden`), nav horizontale en haut sinon.
- Padding bas sur le contenu pour ne pas passer sous la tab bar.
- Grilles déjà responsives (`grid-cols-1 sm:…`) conservées.

## Déploiement

- **`docker-compose.yml` (front)** : service `ui`, image `tellenn/ui-tellenn-artifacts-client:latest`,
  ports `8899:3000`, `API_URL=http://app:8888`, réseau externe `tellenn-network`.
- **`.github/workflows/docker-publish.yml` (front)** : sur push `master`/`main` :
  build + push Docker Hub (`secrets.DOCKER_USERNAME` / `DOCKER_PASSWORD`), puis job
  `deploy` sur runner self-hosted : `docker pull`, libération défensive du port 8899
  (ancien conteneur `ui` du compose backend), `docker compose up -d`.
- **Étapes manuelles utilisateur** : créer le repo GitHub, ajouter les 2 secrets,
  pousser `master`. Le backend doit avoir été redéployé une fois (réseau nommé) —
  sinon `docker network create tellenn-network` à la main.

## Vérification

- Back : `./mvnw test` (unitaires ; les IT Mongo restent opt-in `-Dmongo.it`).
- Front : `npm run build` (TypeScript strict) + `npm run lint`.
- E2E local : backend sur :8888, `npm run dev`, vérifier `/`, `/bank`, `/tasks` en
  viewport mobile et desktop.

## Hors périmètre (YAGNI)

- Actions d'écriture depuis l'UI (retraits banque, réservations…).
- WebSocket temps réel (le payload backend est une string brute).
- Framework de test front.
