# Artifacts Front

Dashboard web (Next.js 16 + Tailwind v4) pour le bot [Artifacts MMO](https://artifactsmmo.com)
du repo `artifacts-client`. Pensé pour un usage desktop **et mobile** (tab bar en bas d'écran).

## Pages

| Route | Contenu |
|-------|---------|
| `/` | Statut des 5 personnages (HP, XP, or, tâche, objectif, cooldown) |
| `/characters/[name]` | Détail d'un personnage (stats, compétences, équipement, inventaire) |
| `/bank` | Contenu de la banque : or, slots, recherche et filtres par type |
| `/tasks` | Pool de récolte (restant / réservé par personnage) + tâches de jeu |

Les données sont fetchées côté serveur sur le backend Spring Boot (`:8888`)
et rafraîchies toutes les 10 s.

## Développement

```bash
npm install
npm run dev     # http://localhost:3000 — backend attendu sur localhost:8888
npm run build   # vérifie TypeScript
npm run lint
```

L'URL du backend se règle via `API_URL` (runtime, prioritaire) ou
`NEXT_PUBLIC_API_URL` (`.env.local`, figée au build).

## Déploiement

Le workflow `.github/workflows/docker-publish.yml` (push sur `master`/`main`) :

1. build & push de l'image `tellenn/ui-tellenn-artifacts-client:latest` sur Docker Hub ;
2. déploiement sur le runner self-hosted via `docker-compose up -d`
   (service `ui`, port `8899`, réseau externe `tellenn-network` créé par le
   compose du backend).

### Mise en place (une fois)

1. Créer le repo GitHub et pousser `master`.
2. Ajouter les secrets d'Actions `DOCKER_USERNAME` et `DOCKER_PASSWORD`.
3. Redéployer une fois le backend (son compose nomme désormais le réseau
   `tellenn-network`) — ou créer le réseau à la main :
   `docker network create tellenn-network`.
