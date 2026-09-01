# Tests

*Dernière mise à jour par l'agent : 2026-09-01 21:02*

## État actuel

**Aucun test automatisé n'existe** — ni dans ce dossier `next/` (le projet actif), ni dans les anciens `../front/`/`../back/`. Toute la migration Express+Vite → Next.js a été vérifiée par des smoke tests manuels (`curl` sur les 4 routes API, navigation réelle via Playwright headless) pendant la session de migration, documentés ci-dessous pour mémoire — ils devraient à terme devenir des tests automatiques plutôt que rester des vérifications ponctuelles.

## Vérifications manuelles déjà effectuées (migration du 2026-09-01)

| Vérification | Méthode utilisée | Résultat |
|---|---|---|
| `npm run build` passe (local) | Bash, à chaque changement de code | ✅ |
| `GET /api/partitions` renvoie les partitions depuis Neon | `curl` | ✅ 200, JSON avec les 422 morceaux |
| `PUT /api/partitions/:id` refuse un mauvais mot de passe | `curl` | ✅ 403, `{"error":"Mot de passe incorrect"}` |
| `PUT /api/partitions/:id` accepte le bon mot de passe | `curl` | ✅ 200, partition mise à jour |
| `POST /api/ai/song-insight` génère une fiche IA (1er appel) | `curl` | ✅ 200, ~8,5s (appel OpenAI réel) |
| `POST /api/ai/song-insight` sert le cache DB (2e appel, même partition) | `curl` | ✅ 200, ~0,1-0,3s |
| `GET /api/sync` synchronise Cloudinary → Postgres sans erreur | `curl` + lecture des logs `next dev` | ✅ |
| Aucune erreur de rendu SSR (`DOMMatrix`) au build | `npm run build` | ✅ après correction (voir `DOC/error.md` #1) |
| Rendu visuel complet (liste, sélection, PDF fit-to-view, zoom) | Playwright headless (script one-off, `page.goto` + `screenshot` + `console --errors`) | ✅ aucune erreur console, capture conforme au design attendu |
| Même vérification sur le déploiement preview Vercel | Playwright headless sur l'URL preview réelle | ✅ identique au rendu local |
| Même vérification sur le déploiement de production Vercel | `curl` sur les 4 routes + vérification visuelle | ✅ |

Ces vérifications n'ont **pas** couvert : la vue mobile (`MobileViewer`) sur un vrai téléphone, l'impression réelle (`window.print()`), le téléchargement de PDF, et le comportement du champ recherche avec la syntaxe `(Bb)` — tout ça reste à vérifier manuellement (voir checklist ci-dessous) ou à automatiser.

## Plan de tests proposé

### 1. Tests unitaires (priorité haute — rien n'existe, gain rapide)

Candidats naturels : fonctions pures, faciles à isoler, avec un vrai historique de bug potentiel.

| Fichier à tester | Fonction(s) | Ce qu'il faut couvrir |
|---|---|---|
| `lib/openai.ts` | `normalizeInsight` | Rejette si `composerWord`/`tonalite`/`grille` manquants ou vides ; rejette si `anecdotes` a moins de 3 ou plus de 6 éléments ; tronque à 6 si plus fourni ; filtre les éléments non-string ; trim de chaque champ |
| `lib/openai.ts` | `extractResponseText` | Format `output_text` direct ; format `output[].content[].text` imbriqué ; renvoie une chaîne vide si aucun texte exploitable |
| `components/SearchList.tsx` | logique de filtre (actuellement inline, à extraire en fonction pure, ex. `filterPartitions(partitions, search)`) | Recherche vide → tout affiché ; recherche `< 3` caractères → tout affiché (comportement actuel, à documenter comme voulu ou à corriger, voir `DOC/refacto.md`) ; syntaxe `"(Bb)"` → filtre exact sur `musical_key` ; recherche normale → matcher titre/compositeur/catégorie insensible à la casse |

Ces trois cibles n'ont aucune dépendance externe (pas de DB, pas d'API) — testables avec Vitest sans mock, en quelques dizaines de minutes de travail.

### 2. Tests d'intégration des routes API (priorité moyenne)

Plus lourds à mettre en place (nécessitent de mocker `postgres`, `cloudinary`, et l'appel `fetch` vers OpenAI), mais couvrent le comportement réellement exposé.

- `GET /api/partitions` : 200 + forme de la réponse avec DB mockée ; 500 si la requête SQL échoue.
- `PUT /api/partitions/[id]` : 403 si mot de passe absent/incorrect ; 400 si `title`/`composer` vides ; 404 si `id` inexistant ; 200 + upsert du compositeur sur succès.
- `POST /api/ai/song-insight` : 400 si champs requis manquants ; cache hit (DB mockée avec résultat existant) ne doit **jamais** appeler `generateSongInsight` ; cache miss appelle OpenAI puis persiste le résultat ; 500 si OpenAI échoue ou renvoie un JSON invalide.
- `GET /api/sync` : toujours 200 avec le message de confirmation, même si `syncPartitions()` lève une erreur en interne (comportement actuel : l'erreur est loguée mais jamais renvoyée au client — à confirmer que c'est le comportement voulu, voir `DOC/refacto.md`).

### 3. Test de bout en bout (priorité basse, le plus proche de l'usage réel)

Outil déjà utilisé avec succès pendant la migration : **Playwright**.

- Parcours complet : chargement de la liste → sélection d'une partition → affichage PDF → zoom → téléchargement → impression.
- Édition de métadonnées : ouverture du dialogue → mauvais mot de passe (message d'erreur affiché) → bon mot de passe → mise à jour visible dans la liste sans rechargement.
- Fiche IA : ouverture sur une partition jamais consultée (état de chargement visible) → résultat affiché ; réouverture → résultat instantané (cache).
- Vue mobile : réduction du viewport sous 860px → bascule vers `MobileViewer` → mêmes actions (zoom, édition, fiche IA) fonctionnelles.

### 4. Checklist manuelle à rejouer après tout changement touchant à l'UI ou aux routes API

- [ ] Recherche : taper moins de 3 caractères affiche toujours tous les résultats (comportement actuel — vérifier que c'est voulu).
- [ ] Recherche par tonalité `(Bb)` filtre exactement sur les partitions en `Bb`, insensible à la casse.
- [ ] Sélection d'une partition réinitialise le zoom à 100% et ferme la fiche IA précédemment ouverte.
- [ ] Redimensionner la fenêtre sous 860px bascule vers la vue mobile sans perte de sélection.
- [ ] Édition de métadonnées : les 4 champs (titre, compositeur, tonalité, catégorie) se pré-remplissent avec les valeurs actuelles à l'ouverture du dialogue.
- [ ] Édition de métadonnées : après succès, la liste de gauche reflète immédiatement le nouveau titre/compositeur sans rechargement de page.
- [ ] Fiche IA : le bouton "Réessayer" apparaît bien en cas d'erreur et relance `handleGenerateInsight`.
- [ ] Téléchargement PDF : le nom de fichier proposé correspond au titre de la partition (vue mobile) ou à `"partition.pdf"` (vue desktop, voir `DOC/refacto.md` pour l'incohérence).
- [ ] `GET /api/sync` : lancé deux fois de suite sur les mêmes fichiers Cloudinary, ne crée pas de doublon (upsert `ON CONFLICT` sur `name_pdf`).

## Pourquoi il n'y a pas encore de tests automatisés

Le projet a été construit puis migré dans un contexte d'itération rapide (voir `DOC/roadmap.md`) — chaque étape a été vérifiée manuellement pour débloquer la suivante, y compris pendant la bascule Vercel où plusieurs problèmes de configuration (Framework Preset, domaine figé) ont nécessité des allers-retours en conditions réelles plutôt qu'en local. Les tests unitaires proposés en section 1 sont la suite logique la moins coûteuse : les fonctions ciblées existent déjà, sont pures, et n'ont jamais été modifiées depuis leur écriture — un bon point de départ avant de s'attaquer aux routes API ou au end-to-end.
