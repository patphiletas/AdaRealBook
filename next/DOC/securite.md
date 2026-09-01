# Sécurité

*Dernière mise à jour par l'agent : 2026-09-01 21:02*

**Règle d'entretien : toute décision touchant au mot de passe d'édition, aux clés API, au stockage de secrets ou à la validation des entrées doit être ajoutée ici au moment où elle est prise.**

## Contexte et modèle de menace

App mono-utilisateur (Patrice), déployée sur une URL publique (`real-book-patphiletas-projects.vercel.app`) partagée sur un CV — donc **effectivement visitée par des inconnus**, contrairement à une app perso non partagée. Le modèle de menace n'est pas "un attaquant motivé cherchant à compromettre une infrastructure", mais deux risques concrets et réalistes vu ce contexte :

1. **Un visiteur du CV clique sur "Modifier"** et tombe sur le formulaire d'édition — sans mot de passe, il ne peut rien changer, mais le formulaire lui-même est visible publiquement.
2. **Abus de coût** : les routes IA (OpenAI) et synchro (Cloudinary) sont appelables par n'importe qui.

Ce document évalue les protections en place à l'aune de ce risque réel, pas d'un scénario d'attaque sophistiqué.

## Corrections appliquées le 2026-09-01 (audit → correctifs, du plus au moins critique)

1. **`POST /api/ai/song-insight` acceptait n'importe quel `partitionId`/`title`/`composer` sans vérifier qu'ils correspondent à une vraie partition** — un appelant pouvait forcer un appel OpenAI payant à chaque requête en inventant un `partitionId` jamais vu (le cache est indexé par `partitionId`, donc un ID inventé contournait systématiquement le cache). C'était le risque le plus critique : coût OpenAI non borné. **Corrigé** : la route ne prend plus que `partitionId` en entrée, va chercher `title`/`composer` en base (`SELECT ... WHERE p.id = ${partitionId}`), et renvoie 404 si la partition n'existe pas — l'abus est maintenant borné au nombre réel de partitions (422), chacune ne coûtant qu'un seul appel OpenAI (mise en cache ensuite). `lib/openai.ts` inchangé, `app/api/ai/song-insight/route.ts` et l'appel côté client (`app/page.tsx`) mis à jour en conséquence.
2. **`GET /api/sync` n'avait aucune protection**, contrairement à `PUT /api/partitions/:id`. **Corrigé** : requiert désormais `?password=...` (même `EDIT_PASSWORD`), vérifié via `checkEditPassword` (voir point 3).
3. **Comparaison du mot de passe (`!==`) non résistante au timing.** **Corrigé** : extraction dans `lib/auth.ts` (`checkEditPassword`), qui utilise `crypto.timingSafeEqual` (avec vérification de longueur égale au préalable, requise par l'API Node). Utilisé à la fois par `PUT /api/partitions/:id` et `GET /api/sync`.
4. **Aucune limite de longueur sur `title`/`composer`/`musical_key`/`category`** (`PUT /api/partitions/:id`). **Corrigé** : rejet en 400 au-delà de 200 caractères (titre/compositeur), 100 (catégorie), 20 (tonalité).

Les 4 corrections tiennent dans les fichiers existants, sans nouvelle dépendance : `lib/auth.ts` (nouveau), `app/api/partitions/[id]/route.ts`, `app/api/sync/route.ts`, `app/api/ai/song-insight/route.ts`, `app/page.tsx`. Vérifiées par smoke tests manuels (`curl` + Playwright) après application — voir `DOC/test.md`.

## Authentification / autorisation

- **Aucune authentification** sur les routes de lecture (`GET /api/partitions`) — voulu, c'est une bibliothèque de consultation publique par design.
- **`PUT /api/partitions/:id`** (édition de métadonnées) et **`GET /api/sync`** (synchro Cloudinary → DB, protégée depuis le correctif ci-dessus) partagent le même mot de passe (`EDIT_PASSWORD`), vérifié via `checkEditPassword` (`lib/auth.ts`, comparaison résistante au timing).
  - **Un seul mot de passe pour toutes les partitions et pour la synchro** — pas de notion d'utilisateur, pas de log de qui a édité quoi ou déclenché une synchro.
  - **Aucun rate limiting ni lockout** : rien n'empêche un script de tester le mot de passe en boucle (bruteforce), même si la surface est petite (un seul champ, pas de compte à énumérer). Non corrigé — nécessiterait un état partagé entre invocations serverless (ex: Upstash Redis), pas ajouté pour l'instant faute de besoin confirmé.
  - Le mot de passe transite dans le corps JSON (`PUT`) ou en query string (`GET /api/sync`) — pas de session, à retaper à chaque action.
- **`POST /api/ai/song-insight`** : toujours **sans mot de passe** (délibéré — c'est une fonctionnalité publique, n'importe quel visiteur doit pouvoir consulter une fiche IA), mais l'abus de coût est maintenant borné par la vérification d'existence de la partition (voir correctifs ci-dessus) plutôt que par une authentification.

**Correction déjà faite pendant la migration** (avant cet audit) : l'ancien `back/index.js` (Express, à la racine du dépôt) loggait le mot de passe reçu en clair à chaque tentative (`console.log(`🔑 password reçu: "${password}"...`)`) — supprimé lors de la réécriture en Route Handler Next.js, ce n'était pas une fonctionnalité à reproduire.

## Stockage des secrets

- Tous les secrets (`CLOUDINARY_API_SECRET`, `DATABASE_URL`, `OPENAI_API_KEY`, `EDIT_PASSWORD`) vivent en variables d'environnement — jamais dans le code, `.env.local` est gitignoré (`.env*` dans `.gitignore`).
- Toutes server-only (aucun préfixe `NEXT_PUBLIC_`), utilisées uniquement dans `lib/` et les route handlers — jamais envoyées au bundle client. C'est un vrai gain par rapport à l'ancienne architecture : avant, ces secrets vivaient sur Render (backend séparé) ; maintenant ils vivent dans Vercel côté serveur uniquement, avec la même garantie de non-exposition.
- **Exposition connue** : `DATABASE_URL` (avec identifiants Neon inclus), la clé Cloudinary et la clé OpenAI ont été partagées en clair pendant la session de migration (pour être copiées dans `.env.local` et dans le dashboard Vercel) — elles figurent donc dans l'historique de cette conversation, un canal de confiance mais à connaître. Pas d'action requise sauf si l'une de ces clés doit être considérée compromise pour une autre raison (dans ce cas, la régénérer côté Neon/Cloudinary/OpenAI et mettre à jour Vercel).
- `DATABASE_URL` est une **connection string Neon "pooled"** (host avec `-pooler`) — bon réflexe pour un environnement serverless, où chaque invocation de fonction peut ouvrir sa propre connexion. `lib/db.ts` ajoute en plus `max: 1` sur le client `postgres` pour la même raison.

## Validation des entrées

- **`PUT /api/partitions/:id`** : vérifie que `title` et `composer` sont non vides après `trim()`, **et respectent désormais une limite de longueur** (200/100/20 caractères selon le champ, voir correctifs ci-dessus).
- **`POST /api/ai/song-insight`** : ne prend plus que `partitionId` en entrée, vérifié contre la table `partitions` (voir correctifs ci-dessus) — `title`/`composer` ne sont plus des entrées utilisateur pour cette route, ils viennent de la base.
- **Requêtes SQL** : toutes via les template strings taguées de `postgres` (`` sql`...` ``) — jamais de concaténation de chaîne. C'est la bonne pratique, elle protège structurellement contre l'injection SQL. Point positif confirmé sur l'ensemble de `lib/db.ts`, `lib/cloudinary.ts` et les route handlers.
- **Aucune validation de schéma partagée** (type Zod) — chaque route fait ses propres vérifications manuelles (`typeof x === 'string'`), dupliquées plutôt que centralisées. Voir `DOC/refacto.md`.

## CORS / même origine

- Plus de configuration CORS nécessaire depuis la migration (front et API sur la même origine Next.js) — l'ancien `back/index.js` (racine du dépôt) avait `app.use(cors())` **sans restriction d'origine** (CORS ouvert à tout le monde), donc ce changement est un vrai gain de sécurité en plus d'une simplification.

## Ce qui n'est pas fait / limites connues

- **Pas de rate limiting générique** (par IP ou autre) sur aucune route — nécessiterait un état partagé entre invocations serverless (Upstash Redis ou équivalent), pas ajouté faute de besoin confirmé. L'abus de coût le plus concret (`/api/ai/song-insight` avec des `partitionId` inventés) est déjà fermé par la vérification d'existence (voir correctifs ci-dessus) ; ce qui reste ouvert est plus mineur (bruteforce du mot de passe, appels répétés sur des partitions déjà en cache donc déjà peu coûteux).
- **Pas de protection CSRF explicite** sur `PUT /api/partitions/:id` / `GET /api/sync` au-delà de la nécessité de connaître `EDIT_PASSWORD` — acceptable vu le mot de passe requis, mais ce n'est pas un vrai jeton anti-CSRF.
- **Pas de rotation planifiée des secrets** (`EDIT_PASSWORD`, clés API).

## Vulnérabilités connues dans les dépendances (`npm audit`)

Relevé le 2026-09-01 :

- **`pdfjs-dist` 5.7.284** (installé via `^5.7.284`, plage vulnérable `>=5.6.83 <6.2.108`) : faille **haute sévérité**, [GHSA-hq66-cqwq-w95j](https://github.com/advisories/GHSA-hq66-cqwq-w95j) — exécution JavaScript arbitraire à l'ouverture d'un PDF malveillant (CWE-79). Correctif disponible en `pdfjs-dist@6.3.289` (montée majeure, `react-pdf@^10.5.0` devra être revérifié pour compatibilité avant de monter).
  - **Risque réel dans ce contexte** : les PDF affichés proviennent exclusivement du compte Cloudinary de Patrice (`dpnudoyxb`), alimenté par lui-même via la synchro `/api/sync` — pas d'upload public, pas de PDF venant d'un tiers non fiable. Le vecteur d'attaque (un PDF piégé rendu côté client) suppose qu'un fichier malveillant entre dans ce compte Cloudinary, ce qui demanderait d'abord un accès aux identifiants Cloudinary eux-mêmes. Risque faible mais pas nul (ex: erreur d'upload d'un fichier provenant d'ailleurs). **Non corrigé pour l'instant** — nécessite une montée de version majeure et un re-test manuel du rendu PDF (zoom, fit-to-view) avant d'être appliqué ; pas fait dans ce lot de correctifs pour rester sur des changements contenus et sans risque de régression visuelle. À planifier séparément, voir `DOC/refacto.md`.
  - Cet écart de version vient du fait que l'installation pendant la migration (`npm install pdfjs-dist@^5.7.284`) a résolu vers la dernière version compatible au moment de l'installation, plus récente que celle utilisée par l'ancien front (`5.4.296` selon le README d'origine) — dérive naturelle d'un `^` en semver, sans impact fonctionnel observé (build et smoke tests passent).
- **0 vulnérabilité** sur les autres dépendances directes (`next`, `react`, `react-dom`, `postgres`, `cloudinary`) au moment du relevé.

`npm audit fix` ne propose pas de correctif non-majeur ici — la seule option est la montée majeure de `pdfjs-dist`, à tester manuellement avant d'être appliquée vu son rôle central dans l'app.
