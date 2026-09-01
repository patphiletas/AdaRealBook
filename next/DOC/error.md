# Journal des bugs

*Dernière mise à jour par l'agent : 2026-09-01 22:45*

Chaque bug/blocage rencontré pendant la migration Express+Vite → Next.js, sa cause réelle, et comment il a été résolu. But : ne pas retomber deux fois dans le même piège.

**Règle d'entretien : toute nouvelle erreur non triviale rencontrée doit être ajoutée ici, dans le même format, dès qu'elle est résolue.**

---

## #1 — Build cassé : `ReferenceError: DOMMatrix is not defined`

- **Date** : 2026-09-01
- **Symptôme** : `npm run build` échouait à l'étape "Generating static pages" avec `DOMMatrix is not defined`, provenant de `pdf.js/src/display/canvas.js`.
- **Cause** : `app/page.tsx` importait `{ pdfjs } from "react-pdf"` directement au niveau module, pour configurer `pdfjs.GlobalWorkerOptions.workerSrc`. Même si `app/page.tsx` est un Client Component (`'use client'`), Next.js **prérend quand même les Client Components en HTML côté serveur** avant envoi au client — cet import statique était donc évalué côté serveur, où `DOMMatrix` (API navigateur) n'existe pas. `PdfViewer`/`MobileViewer` étaient déjà correctement chargés via `next/dynamic({ ssr: false })`, mais l'import de `pdfjs` dans `page.tsx` lui-même contournait cette protection.
- **Résolution** : extraction de l'initialisation du worker dans `lib/pdfWorker.ts`, importé uniquement à l'intérieur de `PdfViewer.tsx` et `MobileViewer.tsx` (les deux composants déjà exclus du rendu serveur via `next/dynamic`) — jamais depuis `app/page.tsx`.
- **Fichiers** : `lib/pdfWorker.ts` (nouveau), `app/page.tsx`, `components/PdfViewer.tsx`, `components/MobileViewer.tsx`.
- **Leçon générale** : `next/dynamic({ ssr: false })` protège le composant qu'il charge, mais pas les imports statiques placés ailleurs dans la chaîne — tout module qui touche une API navigateur doit être importé exclusivement depuis un point déjà exclu du rendu serveur, jamais depuis le composant parent qui orchestre le `dynamic()`.

---

## #2 — `npm install` n'installe pas les devDependencies

- **Date** : 2026-09-01
- **Symptôme** : après un `npm install` classique, le build échouait avec `Cannot find module '@tailwindcss/postcss'` alors que le package était bien listé dans `package.json`.
- **Cause** : la variable d'environnement `NODE_ENV=production` était positionnée dans le shell local (hors du contrôle du projet) — npm applique alors `omit=dev` par défaut, sautant silencieusement toutes les devDependencies (`tailwindcss`, `typescript`, `eslint` compris) à l'installation.
- **Résolution** : `npm install --include=dev` force l'installation malgré `NODE_ENV=production`.
- **Fichier** : aucun (environnement, pas le code).
- **Leçon générale** : si un module devDependency manque après un `npm install` qui semble avoir réussi, vérifier `echo $NODE_ENV` avant de suspecter le `package.json` ou le lockfile.

---

## #3 — Erreur `@tailwindcss/postcss` malgré une installation correcte

- **Date** : 2026-09-01
- **Symptôme** : après avoir corrigé #2 (`@tailwindcss/postcss` bien présent dans `node_modules`, vérifié par `require.resolve`), le build Turbopack échouait encore avec `Cannot find module '@tailwindcss/postcss'`.
- **Cause** : cache de build Turbopack (`.next/`) devenu incohérent avec le nouvel état de `node_modules` après les réinstallations successives liées à #2.
- **Résolution** : `rm -rf .next` puis nouveau `npm run build` — a immédiatement résolu l'erreur.
- **Fichier** : aucun (cache, pas le code).
- **Leçon générale** : après toute réinstallation de dépendances qui touche aux devDependencies ou aux plugins PostCSS/Tailwind, vider `.next/` avant de re-diagnostiquer une erreur de module manquant.

---

## #4 — Déploiement Vercel "réussi" mais vide (404 sur toutes les routes)

- **Date** : 2026-09-01
- **Symptôme** : le premier déploiement preview sur Vercel après changement du Root Directory (`front` → `next`) affichait des logs de build propres (`next build` réussi, routes listées correctement), mais toutes les URLs de l'app renvoyaient `404 NOT_FOUND` au niveau de la plateforme Vercel elle-même (`x-vercel-error: NOT_FOUND`), pas une 404 applicative Next.js.
- **Cause** : le projet Vercel `real-book` avait été configuré à l'origine pour l'ancien front Vite, avec **Framework Preset: "Other"** et un **override manuel de l'Output Directory sur `dist`**. Changer le Root Directory vers `next` a bien fait construire le bon projet Next.js (`vercel build` détecte Next.js via `package.json` indépendamment du Framework Preset affiché), mais l'étape de déploiement a ensuite cherché le résultat à publier dans `dist/` — qui n'existe pas pour une app Next.js (qui a sa propre convention de build output) — d'où un déploiement effectivement vide.
- **Résolution** : dans Vercel → Settings → Build and Deployment, passer **Framework Preset** sur **Next.js** et **désactiver le toggle Override** sur Output Directory.
- **Fichier** : aucun (configuration Vercel, pas le code).
- **Leçon générale** : changer uniquement le Root Directory d'un projet Vercel préexistant ne suffit pas si ce projet a des overrides de build hérités d'un framework précédent — toujours revérifier Framework Preset et tous les toggles "Override" après un tel changement, pas seulement le Root Directory.

---

## #5 — Domaine personnalisé figé sur le tout premier déploiement du projet

- **Date** : 2026-09-01
- **Symptôme** : après la bascule en production, l'alias auto-généré `real-book-patphiletas-projects.vercel.app` servait bien la nouvelle app Next.js, mais le domaine personnalisé `real-book-patphiletas.vercel.app` (sans "-projects") continuait de servir l'**ancien** front Vite (titre `book.json`, `vite.svg`), malgré un cache-busting explicite.
- **Cause exacte non identifiée avec certitude.** Le domaine était configuré dans l'UI Domains comme "Connect to an environment → Production" (réglage a priori correct), mais une requête directe sur le déploiement associé à ce domaine (via l'API Vercel) résolvait systématiquement vers le tout premier déploiement jamais fait sur ce projet (`createdAt` remontant à la création initiale). Ni un "Refresh", ni une édition de l'assignation suivie de "Save", ni un "Remove" + "Add Existing" n'ont changé ce comportement. Hypothèse la plus probable : un alias posé très tôt via la CLI Vercel (`vercel alias set`), qui crée un enregistrement de bas niveau indépendant de l'UI "Domains" actuelle et n'est pas affecté par les actions de cette UI.
- **Résolution** : **non résolue techniquement**, mais sans conséquence — vérification faite avec Patrice que l'URL réellement utilisée (CV, partage) est `real-book-patphiletas-projects.vercel.app` (avec "-projects"), qui fonctionne correctement. Le domaine cassé (`real-book-patphiletas.vercel.app`, sans "-projects") n'est pas utilisé ; une redirection vers l'URL fonctionnelle a été proposée comme filet de sécurité pour d'éventuels anciens liens, à faire à la discrétion de Patrice.
- **Fichier** : aucun (configuration Vercel).
- **Leçon générale** : sur un projet Vercel ancien (renommé ou reconfiguré plusieurs fois), toujours vérifier **quelle URL est réellement utilisée en pratique** avant de chercher à réparer un domaine qui semble cassé — plusieurs alias auto-générés peuvent coexister (`<nom>-<compte>.vercel.app`, `<nom>-<compte>-projects.vercel.app`, alias legacy d'un ancien nom de projet), et tous ne sont pas forcément vivants ou pertinents.

---

## #6 — Redéploiement lancé sur la mauvaise branche/le mauvais environnement par défaut

- **Date** : 2026-09-01
- **Symptôme** : la boîte de dialogue "Redeploy" ouverte depuis le bouton générique (page Environment Variables) proposait par défaut l'environnement **Production** et le déploiement de la branche **`main`** (l'ancien code, sans le dossier `next/`) — pas le déploiement de la branche de travail (`nextjs-migration`) qu'on cherchait à relancer avec les nouveaux réglages.
- **Cause** : le bouton "Redeploy" générique semble présélectionner le dernier déploiement de Production plutôt que le déploiement actuellement affiché/pertinent dans le contexte de la page.
- **Résolution** : repartir du déploiement **spécifique** voulu, via Deployments → trouver la ligne exacte (bon commit, bonne branche) → menu contextuel (les trois points) **de cette ligne précise** → Redeploy. Ce chemin présélectionne correctement l'environnement et le déploiement voulus.
- **Fichier** : aucun (usage de l'interface Vercel).
- **Leçon générale** : ne jamais valider une action "Redeploy"/"Promote" sans vérifier explicitement, dans la boîte de dialogue elle-même, quel environnement et quel déploiement source sont sélectionnés — les valeurs par défaut ne correspondent pas toujours à l'intention.

---

## #7 — `TypeError: Cannot read properties of null (reading 'toLowerCase')` en tapant une recherche

- **Date** : 2026-09-01
- **Symptôme** : découvert en écrivant les tests unitaires de `filterPartitions` et en vérifiant visuellement (Playwright) après extraction de la logique de recherche — taper une recherche de 3 caractères ou plus faisait planter le rendu (`ul li` disparaissait entièrement de la page, plus aucun résultat affiché).
- **Cause** : `title`/`composer`/`category` sont typés `string` dans `types/interface.ts`, mais la colonne `category` (et parfois `composer`) peut réellement être `null` en base — confirmé en pratique lors d'un test antérieur (`PUT /api/partitions/:id` sans `musical_key`/`category` renvoie bien `"musical_key":null,"category":null`). Le filtre appelait `.toLowerCase()` directement sur ces champs sans vérifier leur présence, contrairement à `musical_key` qui avait déjà `?.` — dès qu'une partition avec un champ `null` entrait dans la liste filtrée, l'appel plantait.
- **Découverte tardive** : ce bug existait déjà dans l'ancien code inline (`front/src/components/SearchList.tsx` avait exactement la même logique, sans protection) — probablement jamais remarqué car peu de partitions ont des champs `null` et la recherche ne les affichait simplement jamais dans les tests manuels précédents (aucun crash observé ne veut pas dire aucun bug : il suffit de ne jamais taper une recherche qui matche une des partitions concernées).
- **Résolution** : `p.title?.toLowerCase()`, `p.composer?.toLowerCase()`, `p.category?.toLowerCase()` (chaînage optionnel, comme `musical_key` l'avait déjà) dans `lib/filterPartitions.ts`.
- **Fichier** : `lib/filterPartitions.ts`.
- **Leçon générale** : un type TypeScript (`category: string`) n'est qu'une déclaration, pas une garantie — si la colonne DB sous-jacente autorise `NULL`, le type devrait être `string | null`, et tout code qui le manipule doit s'en protéger. Une fonction pure extraite pour être testée (ici `filterPartitions`) a immédiatement révélé un vrai bug de production que les vérifications manuelles précédentes n'avaient jamais fait remonter — argument concret en faveur des tests unitaires au-delà de la seule prévention de régression future.

---

## #8 — Le nom de fichier au téléchargement ne changeait pas malgré la correction du code

- **Date** : 2026-09-01
- **Symptôme** : après avoir corrigé l'incohérence relevée dans `DOC/refacto.md` (passer le titre réel de la partition à `PdfViewer` via un nouveau prop `partitionTitle`, utilisé dans `link.download`), une vérification Playwright réelle (`page.waitForEvent("download")` + `download.suggestedFilename()`) montrait toujours l'ancien nom (`128_qf1hqp.pdf`, l'identifiant interne Cloudinary) au lieu du titre attendu.
- **Cause** : l'attribut HTML `download` d'un `<a>` n'est **honoré par les navigateurs que pour une URL de même origine**. Le PDF est servi depuis `res.cloudinary.com`, un domaine différent de l'app — pour une ressource cross-origin, Chromium (et la plupart des navigateurs) ignore silencieusement la valeur de `download` et dérive le nom de fichier de l'URL elle-même. Ni la présence ni l'absence de `target="_blank"` ne changeait ce comportement (testé explicitement pour écarter cette piste) ; Cloudinary ne renvoie pas non plus de `Content-Disposition` qui aurait pu l'expliquer autrement.
- **Résolution** : `lib/downloadFile.ts` récupère le PDF via `fetch()` (Cloudinary renvoie `Access-Control-Allow-Origin: *`, donc pas de blocage CORS), construit une URL `blob:` locale (**same-origin** par nature) à partir du résultat, puis déclenche le téléchargement sur cette URL — l'attribut `download` est alors honoré normalement. Repli sur `window.open` si le `fetch` échoue (ex: hors ligne).
- **Fichiers** : `lib/downloadFile.ts` (nouveau), `components/PdfViewer.tsx`, `components/MobileViewer.tsx`.
- **Leçon générale** : un changement de code qui "a l'air correct" et qui **build sans erreur** n'est pas la même chose qu'un changement **vérifié en conditions réelles** — ici, seul un test qui observe le comportement navigateur réel (l'événement `download` et son nom de fichier suggéré, pas juste l'absence d'erreur) a permis de détecter que le premier correctif ne changeait rien en pratique. À reproduire : pour tout comportement de téléchargement/nom de fichier, vérifier avec un outil qui capture l'événement réel plutôt que de se fier à la lecture du code seule.

---

## Note annexe : accès limité de l'agent pendant le déploiement

Pendant cette migration, l'agent IA n'avait pas d'accès SSH/CLI authentifié pour pousser du code vers GitHub depuis son environnement d'exécution (`Permission denied (publickey)`), et aucun outil MCP disponible ne permettait de modifier les réglages Vercel déjà existants (Root Directory, variables d'environnement, assignation de domaine) sur un projet préexistant — seule leur **lecture** (déploiements, logs de build, variables) était possible. Toutes ces actions ont donc été effectuées par Patrice lui-même, guidé étape par étape par l'agent. Point de méthode à retenir : sur un projet Vercel qui existe déjà (pas un nouveau projet créé par l'agent), s'attendre à devoir déléguer les changements de configuration au propriétaire du compte plutôt qu'à pouvoir les faire directement.
