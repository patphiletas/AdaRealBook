# Tests

*Dernière mise à jour par l'agent : 2026-09-01 22:45*

## État actuel

**21 tests unitaires (Vitest)** couvrent `lib/openai.ts` et `lib/filterPartitions.ts` (voir section 1). Aucun test d'intégration ni end-to-end automatisé n'existe encore — le reste de l'app (routes API, parcours UI complet) est vérifié par des smoke tests manuels (`curl`, navigation réelle via Playwright headless), documentés ci-dessous pour mémoire.

**Commande** : `npm test` (lance `vitest run`, une seule passe, pas de mode watch).

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

## Plan de tests

### 1. Tests unitaires — ✅ fait le 2026-09-01 (Vitest)

| Fichier testé | Fichier de test | Couverture |
|---|---|---|
| `lib/openai.ts` | `lib/openai.test.ts` | `extractResponseText` (format `output_text` direct, format `output[].content[].text` imbriqué, éléments ignorés si pas `output_text`, chaîne vide si rien d'exploitable) ; `normalizeInsight` (accepte un payload valide, trim de tous les champs, rejette si `composerWord`/`tonalite`/`grille` manquant ou vide, rejette si moins de 3 anecdotes, tronque à 6 si plus fourni, filtre les éléments non-string, `null`/`undefined` en entrée) |
| `lib/filterPartitions.ts` | `lib/filterPartitions.test.ts` | Recherche vide/`< 3` caractères → tout affiché, filtre par titre/compositeur/catégorie insensible à la casse, syntaxe `"(Bb)"` → filtre exact sur `musical_key` (insensible à la casse), aucun résultat → tableau vide, **partitions avec `composer`/`musical_key`/`category` à `null` → ne plante pas** (voir `DOC/error.md` #7, bug réel découvert en écrivant ce test) |

**Refactos nécessaires pour rendre ça possible** (voir `DOC/refacto.md`) : `extractResponseText`/`normalizeInsight` exportées depuis `lib/openai.ts` (étaient des fonctions privées du module) ; logique de filtre de `SearchList.tsx` extraite dans `lib/filterPartitions.ts` (était inline dans le composant).

**Commande** : `npm test` — à lancer avant tout commit qui touche `lib/` ou `components/SearchList.tsx`.

### 2. Tests d'intégration des routes API (priorité moyenne, pas encore fait)

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
- [x] Téléchargement PDF : le nom de fichier proposé correspond au titre réel de la partition, desktop et mobile — vérifié le 2026-09-01 via Playwright (`page.waitForEvent("download")` + `suggestedFilename()`), voir `DOC/error.md` #8. À revérifier si `lib/downloadFile.ts` est modifié : un simple changement de prop ne suffit pas à le confirmer, il faut observer l'événement de téléchargement réel.
- [ ] `GET /api/sync` : lancé deux fois de suite sur les mêmes fichiers Cloudinary, ne crée pas de doublon (upsert `ON CONFLICT` sur `name_pdf`).

## Pourquoi il n'y a pas encore de tests automatisés

Le projet a été construit puis migré dans un contexte d'itération rapide (voir `DOC/roadmap.md`) — chaque étape a été vérifiée manuellement pour débloquer la suivante, y compris pendant la bascule Vercel où plusieurs problèmes de configuration (Framework Preset, domaine figé) ont nécessité des allers-retours en conditions réelles plutôt qu'en local. Les tests unitaires proposés en section 1 sont la suite logique la moins coûteuse : les fonctions ciblées existent déjà, sont pures, et n'ont jamais été modifiées depuis leur écriture — un bon point de départ avant de s'attaquer aux routes API ou au end-to-end.
