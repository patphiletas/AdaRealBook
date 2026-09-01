# Refactoring

*Dernière mise à jour par l'agent : 2026-09-01 21:02*

Dette technique identifiée pendant la migration Express+Vite → Next.js — ce qui a déjà été nettoyé au passage, et ce qui reste en suspens.

**Règle d'entretien : quand du code est restructuré, déplacer l'entrée correspondante de "À faire" vers "Fait", avec la date. Ajouter une nouvelle entrée dès qu'une duplication ou un raccourci est repéré, même si on ne le corrige pas tout de suite.**

## Fait

| Date | Refacto |
|---|---|
| 2026-09-01 | Fusion du backend Express (`../back/index.js`, un seul fichier de 310 lignes) et du front Vite en un projet Next.js unique (`next/`) — 4 routes Express → 4 Route Handlers, logique métier reprise à l'identique dans `lib/db.ts`, `lib/cloudinary.ts`, `lib/openai.ts` |
| 2026-09-01 | Suppression du `console.log` qui affichait le mot de passe d'édition en clair à chaque tentative (`../back/index.js` ligne 260) — résidu de debug, jamais réintroduit dans la version Next.js |
| 2026-09-01 | Suppression de la configuration CORS (`app.use(cors())`, sans restriction d'origine dans l'ancien backend) — plus nécessaire, front et API sur la même origine |
| 2026-09-01 | Extraction de l'initialisation du worker `pdfjs` dans `lib/pdfWorker.ts`, importée uniquement par les composants déjà chargés en `next/dynamic({ ssr: false })` (`PdfViewer.tsx`, `MobileViewer.tsx`) — évite d'évaluer `pdfjs-dist` côté serveur (voir `DOC/error.md` #1) |
| 2026-09-01 | Client `postgres` (`lib/db.ts`) configuré avec `max: 1`, adapté à un environnement serverless (chaque invocation de fonction peut ouvrir sa propre connexion) — l'ancien backend Express tournait en process unique long-lived sur Render, ce réglage n'existait pas et n'était pas nécessaire dans ce contexte |
| 2026-09-01 | Référence de version du worker pdf.js rendue dynamique (`pdfjs.version` au lieu d'une chaîne codée en dur `5.4.296`) dans `lib/pdfWorker.ts` — évite un mismatch entre la version installée de `pdfjs-dist` et celle du worker chargé depuis le CDN unpkg |
| 2026-09-01 | Correction de l'ordre des règles `@import` dans `app/globals.css` (police Google Fonts déplacée avant `@import "tailwindcss"`) — l'ordre inverse produisait un avertissement de build (CSS invalide une fois Tailwind expansé), corrigé sans changement visuel |
| 2026-09-01 | Audit sécurité (`DOC/securite.md`) puis correctifs, du plus au moins critique : `POST /api/ai/song-insight` vérifie désormais l'existence de la partition en base avant d'appeler OpenAI (fermait un risque d'abus de coût non borné) ; `GET /api/sync` protégée par le même mot de passe que `PUT /api/partitions/:id` ; comparaison du mot de passe extraite dans `lib/auth.ts` avec `crypto.timingSafeEqual` ; limites de longueur ajoutées sur `title`/`composer`/`musical_key`/`category` |

## À faire

### Pattern try/catch répété dans chaque route

Chaque route (`app/api/partitions/route.ts`, `app/api/partitions/[id]/route.ts`, `app/api/ai/song-insight/route.ts`) répète la même structure : `try { ... } catch { return Response.json({ error }, { status: 500 }) }`. Fonctionne bien à 4 routes, mais un petit wrapper générique (`withErrorHandling(handler)`) éviterait la répétition si le nombre de routes grossit.

### `GET /api/sync` avale ses erreurs sans les remonter

`syncPartitions()` (`lib/cloudinary.ts`) attrape ses propres erreurs et se contente de les loguer (`console.error`) — la route `GET /api/sync` renvoie donc toujours `{ message: "Synchro lancée..." }` avec un statut 200, même en cas d'échec réel de la synchro. Comportement hérité tel quel de l'ancien `back/index.js`. À décider : est-ce voulu (l'appelant n'a de toute façon aucune action à prendre en cas d'échec, seuls les logs serveur comptent), ou faut-il remonter un statut d'erreur exploitable ?

### Aucune validation de schéma partagée

Chaque route valide toujours ses entrées à la main (`typeof title !== "string"`, `!title.trim()`, etc.), dupliqué entre `app/api/partitions/[id]/route.ts` et `app/api/ai/song-insight/route.ts` — seule la vérification du mot de passe a été extraite dans `lib/auth.ts` (2026-09-01). Une petite librairie de validation (type Zod, ou des fonctions maison façon `lib/validation.ts`) centraliserait le reste des règles (présence, longueur) et donnerait des messages d'erreur cohérents.

### `EDIT_PASSWORD` : mot de passe unique partagé

Fonctionne pour un usage strictement personnel, mais architecturalement fragile (voir `DOC/securite.md` pour l'analyse complète) — pas de notion d'utilisateur, pas de log d'édition, pas de rate limiting (même après le durcissement du 2026-09-01, qui a corrigé la comparaison en timing-safe et étendu la protection à `/api/sync`, mais pas ajouté de limite de tentatives). Un vrai mécanisme d'auth (type NextAuth) serait plus correct si l'app gagne plusieurs contributeurs un jour ; pas une priorité tant que Patrice reste le seul éditeur.

### Nom de fichier de téléchargement incohérent entre desktop et mobile

`PdfViewer.tsx` (desktop) propose toujours `"partition.pdf"` comme nom de fichier au téléchargement, alors que `MobileViewer.tsx` (mobile) utilise `` `${partition.title}.pdf` ``. Résidu de la reprise à l'identique de l'ancien code (`front/src/components/PdfViewer.tsx` et `MobileViewer.tsx` avaient déjà cette différence) — à uniformiser sur le nom réel de la partition dans les deux cas.

### `CLOUDINARY_BASE` codé en dur dans `app/page.tsx`

```ts
const CLOUDINARY_BASE = "https://res.cloudinary.com/dpnudoyxb/image/upload";
```

Le nom du cloud Cloudinary (`dpnudoyxb`) est une constante en dur plutôt qu'une variable d'environnement — fonctionne, information publique (visible dans n'importe quelle URL de PDF), mais une variable (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) éviterait de la dupliquer si elle doit changer un jour (changement de compte Cloudinary). **Pré-existant, pas introduit par la migration** : `front/src/App.tsx` (racine du dépôt, ligne 14) avait exactement la même constante en dur avant — reprise à l'identique dans `app/page.tsx`, pas une régression.

### Logique de filtre de `SearchList` non extraite

Le filtrage (recherche texte, syntaxe `"(Bb)"` pour la tonalité, seuil de 3 caractères) vit directement dans le corps du composant `components/SearchList.tsx`, mélangé au rendu JSX. L'extraire en fonction pure (ex. `filterPartitions(partitions, search)`) la rendrait testable unitairement (voir `DOC/test.md`) sans dépendre du rendu React.

### `front/` et `back/` toujours présents dans le dépôt

Dette de transition plutôt que dette de code : les deux dossiers legacy restent dans le dépôt après la migration, en attente d'une suppression formelle une fois `next/` validé en production (voir `DOC/roadmap.md`). Tant qu'ils restent, risque de confusion pour quiconque (humain ou agent) ouvre le dépôt sans contexte — d'où la section "État de transition" en tête d'`AGENTS.md`.

### Dépendance avec vulnérabilité connue (`pdfjs-dist`)

Détail complet dans `DOC/securite.md` — `pdfjs-dist@5.7.284` a une faille haute sévérité connue, corrigée seulement en `6.3.289` (montée majeure). Non corrigé pour l'instant, risque jugé faible dans ce contexte (PDF provenant exclusivement du compte Cloudinary de confiance de Patrice), mais à re-tester (rendu, zoom, fit-to-view) avant de monter la version le jour où ce sera fait.

### Absence de tests, à tout niveau

Aucun test unitaire, d'intégration ou end-to-end n'existe (voir `DOC/test.md` pour le plan détaillé) — toute vérification passe par des smoke tests manuels, refaits à chaque changement. Risque de régression silencieuse sur les routes API et l'UI à chaque évolution future.

### Pas de CI

Aucun pipeline (GitHub Actions ou autre) ne lance `npm run build` automatiquement sur push/PR — toute vérification de build est faite manuellement, en local, avant de pousser. Un simple workflow "build on push" sécuriserait au moins contre un déploiement cassé, sans même attendre l'ajout de vrais tests.
