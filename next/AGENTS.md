<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — AdaRealBook

*Dernière mise à jour par l'agent : 2026-09-01 23:04*

Instructions pour tout agent IA (Claude Code ou autre) qui travaille sur ce projet. Cette documentation est le principal moyen de garder trace de ce qui a été fait, pourquoi, et où en est le projet — à traiter comme une exigence du projet, pas comme un à-côté optionnel.

## Le projet en une phrase

Bibliothèque personnelle de partitions jazz façon Real Book (Patrice, usage perso), Next.js (App Router), déployée sur Vercel, avec synchro Cloudinary → Postgres (Neon) et fiches IA générées à la demande (OpenAI) et mises en cache en base.

## Historique : migration Express+Vite → Next.js (terminée)

Ce dossier `next/` est **le seul projet du dépôt** `AdaRealBook` depuis le 2026-09-01. Il remplace un ancien front Vite/React séparé (`front/`) et un backend Express déployé sur Render (`back/`), supprimés du dépôt une fois la migration validée en production. Détail complet de la migration dans `DOC/roadmap.md`.

## Règle d'or n°0 : une question n'est pas une demande de code

**Constat du 2026-09-01** : plusieurs échanges de ce projet ont été de l'analyse pure (état des lieux, étude de faisabilité, audit) suivie d'une confirmation explicite avant tout code ("allons-y", "oui vas-y"). Ce pattern doit rester la norme.

**Ne pas coder** tant que la demande n'est pas une instruction claire d'agir (ex: "fais-le", "code ça", "vas-y", "implémente", ou un "oui" explicite en réponse à une proposition concrète). Une question ("on ne pourrait pas...", "est-ce que ça marche si..."), une réflexion à voix haute, ou une demande explicite de documentation/idées **sans code** (comme celle qui a produit ce dossier `DOC/`) ne sont pas un feu vert pour écrire ou modifier du code. En cas de doute, répondre/proposer, ne pas coder par anticipation.

## Règle d'or n°1 : entretenir la documentation

**Chaque changement non trivial doit mettre à jour la documentation concernée, dans le même travail que le changement de code — pas après coup.**

| Type de changement | Fichier(s) à mettre à jour |
|---|---|
| Bug corrigé | `DOC/error.md` — nouvelle entrée : date, symptôme, cause réelle, résolution, fichier(s) |
| Fonctionnalité ajoutée ou modifiée | `../README.md` (section Fonctionnalités) + `DOC/roadmap.md` (historique) |
| Idée identifiée mais pas encore faite | `DOC/roadmap.md` (section "Pistes identifiées") |
| Changement touchant le mot de passe d'édition, les clés API, la validation des entrées, les secrets | `DOC/securite.md` |
| Code restructuré, duplication supprimée, dette technique repérée | `DOC/refacto.md` |
| Test ajouté (ou zone qui en aurait besoin) | `DOC/test.md` |
| Nouveau fichier / dossier dans l'architecture de `next/` | `../README.md` (section Architecture) |
| Nouveau fichier créé dans `DOC/` | L'ajouter au tableau "Documentation complémentaire" du `../README.md` |
| Proposition de fonctionnalité soumise par Patrice, pas encore faite | `DOC/features.md` — analyse faisabilité/difficulté/pertinence avant tout code |
| Changement de config Vercel/domaine | `DOC/roadmap.md` |

Si un changement touche plusieurs catégories à la fois, mettre à jour tous les fichiers concernés.

**Marqueur de fraîcheur** : `../README.md`, ce fichier et chaque fichier `DOC/*.md` portent une ligne `*Dernière mise à jour par l'agent : 2026-09-01 23:04*` sous leur titre — à avancer soi-même dès qu'on modifie le fichier (`date "+%Y-%m-%d %H:%M"`).

## Conventions du projet

- **TypeScript**, App Router, composants clients (`"use client"`) uniquement là où c'est nécessaire (état, hooks, `window`/`document`). `app/layout.tsx` reste un composant serveur.
- **Tailwind CSS v4** (`@import "tailwindcss"` dans `app/globals.css`, plugin `@tailwindcss/postcss`) — pas de CSS-in-JS, pas de librairie de composants UI. Les deux fichiers `styles/PdfViewer.css` et `styles/MobileViewer.css` restent en CSS classique (repris tels quels de l'ancien front) — cohérence à garder pour toute nouvelle UI côté visionneuse PDF.
- **`react-pdf` / `pdfjs-dist` ne doivent jamais être importés au niveau module d'un composant serveur ou d'`app/page.tsx` directement** — ils référencent des API navigateur (`DOMMatrix`, Canvas) qui font planter le build si le module est évalué côté serveur. Toujours passer par `next/dynamic(..., { ssr: false })` (voir `components/PdfViewer.tsx`, `components/MobileViewer.tsx`, et `lib/pdfWorker.ts` pour l'initialisation du worker). Détail complet dans `DOC/error.md` #1.
- **Route Handlers** (`app/api/**/route.ts`) : logique métier dans `lib/db.ts`, `lib/cloudinary.ts`, `lib/openai.ts`. Toute nouvelle route doit être enveloppée dans `withErrorHandling` (`lib/withErrorHandling.ts`) plutôt que de répéter un `try/catch` manuel — voir les 4 routes existantes pour le patron (`export const GET = withErrorHandling(async (...) => {...}, "message d'erreur optionnel")`).
- **Validation des entrées** : passer par `lib/validation.ts` (`validatePartitionInput`, `isValidPartitionId`) plutôt que d'écrire de nouvelles vérifications manuelles inline dans une route.
- **Requêtes SQL** : toujours via les template strings taguées de `postgres` (`sql\`...\``), jamais de concaténation de chaîne — c'est ce qui protège contre l'injection SQL (voir `DOC/securite.md`).
- **Variables d'environnement** : toutes server-only (pas de préfixe `NEXT_PUBLIC_`), utilisées uniquement dans `lib/` et les route handlers — jamais exposées au client. Cohérent entre `.env.local` (dev) et Vercel (prod/preview), mais **les deux sont indépendants** : ajouter une variable dans l'un ne l'ajoute pas à l'autre.

## Pièges déjà rencontrés — ne pas y retomber

Détail complet dans `DOC/error.md`, résumé ici :

1. **SSR + `react-pdf`** : `DOMMatrix is not defined` au build si `pdfjs-dist` est importé en dehors d'un composant chargé via `next/dynamic({ ssr: false })`. Voir `lib/pdfWorker.ts`.
2. **`NODE_ENV=production` dans l'environnement shell local** fait sauter les devDependencies à l'installation (`npm install` seul n'installe pas `tailwindcss`/`typescript`/`eslint`). Utiliser `npm install --include=dev` en local si ce cas se reproduit.
3. **Turbopack + cache stale** : après un changement de config (`next.config.ts`, `postcss.config.mjs`), si une erreur de module manquant apparaît alors que le package est bien installé, `rm -rf .next` avant de relancer le build.
4. **Vercel — Framework Preset et Output Directory hérités de l'ancien projet Vite** : lors de la bascule, le projet Vercel `real-book` avait encore `Framework Preset: Other` + `Output Directory: dist` (réglages de l'ancien front Vite) après changement du Root Directory vers `next`. Résultat : build Next.js réussi dans les logs, mais déploiement vide (404 sur toutes les routes) car Vercel cherchait le résultat dans `dist/` au lieu du build Next réel. Toujours vérifier **Framework Preset = Next.js** et **désactiver l'override Output Directory** après un changement de Root Directory sur un projet Vercel préexistant.
5. **Domaine Vercel figé sur un vieux déploiement** : le domaine personnalisé `real-book-patphiletas.vercel.app` est resté épinglé sur le tout premier déploiement du projet (jamais résolu même après Refresh / Remove+Add — cause exacte non identifiée, probablement un alias posé via `vercel alias` avant l'existence de l'UI Domains actuelle). Non bloquant : ce n'est pas l'URL réellement utilisée (voir `DOC/roadmap.md`), mais à garder en tête si ce domaine doit un jour être réactivé.
6. **Sync Cloudinary manuelle, par choix explicite** : `/api/sync` n'est déclenchée qu'à la main (pas de cron), décision prise avec Patrice le 2026-09-01 pour rester sur le plan Vercel Hobby sans complexifier. Ne pas ajouter de cron sans lui redemander.

## Comment lancer / vérifier le projet

```bash
npm install
npm run dev        # http://localhost:3000 (ou port suivant si occupé)
npm run build      # à faire systématiquement avant de dire qu'un changement est prêt
npm test           # tests unitaires (Vitest)
```

**CI** : `.github/workflows/ci.yml` (à la racine du dépôt) lance `npm ci && npm run build && npm test` dans `next/` sur chaque push/PR vers `main` — aucune variable d'environnement requise (le build n'exécute aucun appel réseau réel).

Des tests unitaires existent (`npm test`, voir `DOC/test.md`), mais aucun test d'intégration ni end-to-end automatisé. Toute vérification fonctionnelle sur les routes API et le parcours UI complet passe par des smoke tests manuels (`curl`, navigation réelle) — voir `DOC/test.md` pour la checklist et le plan de tests proposé.

## Déploiement

- Le dépôt GitHub (`patphiletas/AdaRealBook`) est connecté au projet Vercel `real-book` : un `git push` sur `main` redéploie automatiquement en production.
- **Root Directory du projet Vercel = `next`** (le dépôt ne contient plus que ce dossier à sa racine, mais le réglage reste nécessaire — Vercel ne le déduit pas automatiquement).
- URL de production réellement utilisée (CV, partage) : `https://real-book-patphiletas-projects.vercel.app`. D'autres alias existent (`ada-real-book*`, `real-book-patphiletas.vercel.app` sans "-projects") mais ne sont pas à jour ou pas utilisés — voir piège #5 ci-dessus et `DOC/roadmap.md`.
- **Patrice gère lui-même le déploiement, les réglages Vercel et le push Git** — un agent n'a pas d'accès SSH/CLI authentifié pour pousser du code depuis cet environnement. Un agent peut : modifier le code local, lancer `npm run build` pour vérifier, indiquer clairement les commandes à exécuter (`git add`/`commit`/`push`) et les réglages Vercel à changer, mais pas les exécuter à la place de Patrice sans un accès explicitement fourni.
- Un agent peut en revanche interroger l'état de Vercel (déploiements, logs de build, variables d'environnement) via le serveur MCP Vercel s'il est connecté, pour diagnostiquer sans avoir besoin d'accès CLI.

## Configuration externe (hors du code)

Quatre systèmes externes sont impliqués et ne sont pas dans ce dépôt :

- **Neon** (Postgres) : base `neondb`, connection string pooled dans `DATABASE_URL`.
- **Cloudinary** (compte `dpnudoyxb`) : stockage des PDF de partitions, source de la synchro `/api/sync`.
- **Vercel** (compte `patphiletas`, projet `real-book`) : variables d'environnement, domaines, déploiements.
- **OpenAI** : génération des fiches IA (`OPENAI_API_KEY`, modèle configurable via `OPENAI_MODEL`).

Un agent ne peut pas se connecter à ces comptes à la place de Patrice — le guider étape par étape si une action y est nécessaire, ne jamais lui demander ses identifiants ou clés en clair au-delà de ce qui est déjà dans `.env.local`/Vercel.
