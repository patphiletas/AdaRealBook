# Roadmap

*Dernière mise à jour par l'agent : 2026-09-01 23:04*

**Règle d'entretien : ajouter une ligne dans "Historique" à chaque évolution livrée, et déplacer une idée de "Pistes identifiées" vers "Historique" (ou la retirer si abandonnée) dès qu'elle est faite.**

## Historique (fait)

| Date | Évolution |
|---|---|
| — | Genèse : app de consultation de partitions jazz — front React/Vite, backend Express, PostgreSQL (Neon), stockage Cloudinary, fiches IA OpenAI (voir README pour le détail des fonctionnalités d'origine) |
| — | Normalisation du schéma DB : extraction des compositeurs dans une table dédiée, cache des fiches IA (`song_insights`/`anecdotes`) pour éviter un appel OpenAI à chaque consultation |
| — | Ajout de l'édition de métadonnées (titre/compositeur/tonalité/catégorie), protégée par `EDIT_PASSWORD`, et de l'affichage PDF en fit-to-view |
| 2026-09-01 | **Décision de migrer vers un Next.js unique**, motivée par le coût de l'hébergement du backend Express sur Render — étude de faisabilité, puis migration effective |
| 2026-09-01 | Scaffold du projet Next.js 16 (App Router, Turbopack, TypeScript, Tailwind v4) dans `next/`, en parallèle de `front/`/`back/` |
| 2026-09-01 | Transcription des 4 routes Express en Route Handlers (`app/api/partitions`, `app/api/partitions/[id]`, `app/api/ai/song-insight`, `app/api/sync`), logique métier reprise à l'identique dans `lib/db.ts`/`lib/cloudinary.ts`/`lib/openai.ts` |
| 2026-09-01 | UI reprise à l'identique dans `app/page.tsx` et `components/` (Client Components), fetch relatifs au lieu de `VITE_API_URL` — plus besoin de CORS |
| 2026-09-01 | Décision prise avec Patrice : synchro Cloudinary → DB reste **manuelle** (bouton/route `/api/sync`), pas de cron Vercel — pour rester sur le plan Hobby sans complexifier l'infra |
| 2026-09-01 | Décision prise avec Patrice : nouveau dossier `next/` construit **en parallèle** de `front/`/`back/`, bascule et suppression des anciens dossiers dans un second temps une fois validé |
| 2026-09-01 | Correction du bug SSR `DOMMatrix is not defined` (`pdfjs-dist` importé au niveau module d'`app/page.tsx`) — voir `DOC/error.md` #1 |
| 2026-09-01 | Migration validée localement (build + smoke tests API + vérification visuelle Playwright) |
| 2026-09-01 | Push de la branche `nextjs-migration`, déploiement preview Vercel — plusieurs allers-retours de configuration nécessaires (voir `DOC/error.md` #2 à #4) avant un déploiement preview pleinement fonctionnel |
| 2026-09-01 | Merge sur `main`, déploiement en production sur le projet Vercel `real-book` (même domaine que l'ancien front, comme demandé) |
| 2026-09-01 | Vérification complète en production (4 routes API + rendu visuel) sur l'URL réellement utilisée (`real-book-patphiletas-projects.vercel.app`, celle du CV de Patrice) |
| 2026-09-01 | Feu vert donné pour couper Render, après validation complète de la production Next.js — **à confirmer que Patrice l'a bien fait de son côté** (voir "État de transition" dans `AGENTS.md`) |
| 2026-09-01 | Rédaction de la documentation complète du projet (`README.md`, `AGENTS.md`, dossier `DOC/`), placée dans `next/` pour être commitée avec le projet actif |
| 2026-09-01 | Correctifs de sécurité, du plus au moins critique (suite à l'audit `DOC/securite.md`) : blocage de l'abus de coût sur `/api/ai/song-insight` (vérification d'existence de la partition avant appel OpenAI), protection de `/api/sync` par mot de passe, comparaison du mot de passe en timing-safe (`lib/auth.ts`), limites de longueur sur les champs édités |
| 2026-09-01 | Délai artificiel d'1 seconde sur un mot de passe incorrect (`delayFailedAuth`, `lib/auth.ts`) — mitigation légère du bruteforce séquentiel, sans nouvelle infra (pas une vraie protection contre des requêtes parallèles, voir `DOC/securite.md`) |
| 2026-09-01 | Premiers tests unitaires (Vitest, 21 tests) sur `lib/openai.ts` et `lib/filterPartitions.ts` (extrait de `SearchList.tsx` pour être testable) — a révélé et corrigé un vrai bug de production (`.toLowerCase()` sur un champ `null`, voir `DOC/error.md` #7) |
| 2026-09-01 | Refacto de suivi : nom de fichier de téléchargement uniformisé (desktop/mobile), CI GitHub Actions ajoutée (build + tests sur chaque push/PR), et **suppression définitive de `front/`, `back/` et du `vercel.json` racine** — `next/` est désormais l'unique contenu du dépôt |
| 2026-09-01 | Refacto de suivi (suite) : wrapper `withErrorHandling` appliqué aux 4 routes (fin du pattern try/catch répété) — a permis de corriger `GET /api/sync` qui renvoyait toujours 200 même en cas d'échec réel ; validation centralisée (`lib/validation.ts`) remplaçant les vérifications dupliquées entre les routes — 33 tests unitaires au total |

## Pistes identifiées pendant la migration (non faites)

Notées au fil de l'eau, à confirmer avant de les faire — détail et avis dans `DOC/features.md`.

- **Filtres avancés en UI** (tonalité, catégorie) — la donnée existe déjà en base, juste pas exposée en filtre (`DOC/features.md` #1, #5).
- **Favoris / dernières partitions consultées** — `localStorage`, pas de nouvelle table (`DOC/features.md` #2).
- **Playlists / sets** pour préparer un concert — déjà en roadmap avant la migration, toujours pas fait (`DOC/features.md` #10).
- **Authentification** (déjà en roadmap avant la migration) — analysé et jugé non prioritaire tant qu'un seul éditeur (`DOC/features.md` #7).
- **PWA + cache offline des PDF** — pertinent pour un usage terrain (répétition/concert sans réseau fiable) (`DOC/features.md` #8).
- **Protection de `/api/sync` et limite sur `/api/ai/song-insight`** — le point de sécurité le plus simple et le plus rentable identifié pendant l'audit (`DOC/securite.md`, `DOC/features.md` #12).

## Décisions prises pendant la migration (2026-09-01)

- **Root Directory Vercel** : `next` (pas la racine du dépôt) — nécessaire pour que Vercel construise le bon projet dans ce monorepo de fait.
- **Sync manuelle plutôt que cron** : décision explicite de Patrice, pour rester sur le plan Vercel Hobby (cron limité à une exécution/jour) sans complexifier.
- **`front/`/`back/` conservés en parallèle** le temps de valider `next/`, supprimés le 2026-09-01 une fois la migration jugée stable en production (voir historique ci-dessus).
- **URL de production inchangée** : bascule faite sur le même projet Vercel (`real-book`) et le même domaine que l'ancien front, pas de nouveau projet ni de changement d'URL pour les liens déjà partagés (CV).
- **Domaine `real-book-patphiletas.vercel.app` (sans "-projects") laissé de côté** : resté figé sur un très vieux déploiement malgré plusieurs tentatives de correction (Refresh, edit d'assignation, remove+re-add) — non prioritaire une fois confirmé que ce n'est pas l'URL réellement utilisée (`real-book-patphiletas-projects.vercel.app`, avec "-projects", est la bonne). Détail dans `DOC/error.md` #4.
