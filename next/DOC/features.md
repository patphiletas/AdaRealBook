# Suggestions d'amélioration — étude de faisabilité

*Dernière mise à jour par l'agent : 2026-09-01 21:02*

Idées d'amélioration UI/UX et techniques pour AdaRealBook, en s'appuyant sur le code actuel (`next/`) et les évolutions déjà notées dans le README ("Prochaines évolutions"). **Aucun code n'a été touché pour produire ce document** — c'est une étude de faisabilité, de difficulté, et un avis honnête sur la pertinence, pas une implémentation.

Échelle de difficulté : 🟢 faible (quelques lignes, pas de nouvelle donnée à stocker) · 🟡 moyenne (nouvelle UI ou nouveau champ de données, reste dans l'architecture actuelle) · 🔴 élevée (nouvelle infra, nouveau modèle de données transverse, ou ambiguïté à trancher avant de coder).

Échelle de pertinence (mon avis, pas un fait) : 🟢 clairement utile pour l'usage réel (bibliothèque perso, consultation solo, parfois en situation de jeu) · 🟡 utile sous condition · 🔴 discutable — je pense que ça résout un problème qui n'est pas encore vécu.

## Vue d'ensemble

| # | Idée | Difficulté | Pertinence (mon avis) |
|---|---|---|---|
| 1 | Filtres avancés (tonalité/catégorie en UI, pas en syntaxe cachée) | 🟢 | 🟢 |
| 2 | Favoris / dernières partitions consultées | 🟢 | 🟢 |
| 3 | Recherche : indice visuel pour la syntaxe `(Bb)`, seuil de 3 caractères revu | 🟢 | 🟡 |
| 4 | Mode sombre | 🟡 | 🟡 |
| 5 | Gestion multi-volumes / filtrage par catégorie existante | 🟢 | 🟢 |
| 6 | Transposition de tonalité selon l'instrument (Bb/Eb/C) | 🔴 | 🟡 |
| 7 | Authentification réelle (au-delà du mot de passe unique) | 🔴 | 🔴 |
| 8 | PWA installable + cache offline des PDF déjà consultés | 🟡 | 🟢 |
| 9 | Annotations sur PDF (doigtés, respirations) | 🔴 | 🟡 |
| 10 | Playlists / sets pour préparer un concert | 🟡 | 🟢 |
| 11 | Impression améliorée (sélection de pages) | 🟡 | 🟡 |
| 12 | Protection de `/api/sync` et `/api/ai/song-insight` (rate limit) | 🟢 | 🟢 |

---

## 1. Filtres avancés en UI (tonalité, catégorie) — 🟢 faible, 🟢 pertinent

**Contexte** : déjà noté dans le README ("Filtres avancés (tonalité, époque, style)"). Aujourd'hui, filtrer par tonalité passe par une syntaxe cachée dans le champ de recherche (`"(Bb)"`), non découvrable sans lire le placeholder attentivement — et il n'y a aucun filtre par `category` (Realbook, Blues, Bebop...) alors que la donnée existe déjà en base et s'affiche déjà dans le bandeau "morceau en cours".

**Ce que ça implique** : des chips de filtre (comme le filtre par catégorie de `todo-agenda`, référence utile) au-dessus ou à côté de la barre de recherche, calculées depuis les valeurs déjà présentes dans `partitions` (pas de nouvelle route API). Combinable avec la recherche texte existante.

**Mon avis** : la donnée existe déjà, c'est purement une question d'exposer ce qui est déjà là en base plutôt que caché dans une syntaxe texte. Je le mettrais en premier — rapport effort/valeur excellent.

---

## 2. Favoris / dernières partitions consultées — 🟢 faible, 🟢 pertinent

**Ce que ça implique** : pas besoin de nouvelle table côté DB pour un usage mono-utilisateur — `localStorage` suffit (liste d'IDs de partitions, mise à jour à chaque sélection ou clic sur une étoile). Affiché en tête de la liste ou dans un onglet dédié.

**Mon avis** : pour une bibliothèque de 422 morceaux consultée régulièrement, retrouver les 5-10 partitions qu'on rejoue le plus souvent sans re-taper une recherche à chaque fois est un vrai gain de confort quotidien, pour un coût quasi nul (pas de backend à toucher).

---

## 3. Recherche : rendre la syntaxe `(Bb)` découvrable, revoir le seuil de 3 caractères — 🟢 faible, 🟡 pertinent

**Contexte** : `components/SearchList.tsx` a deux comportements non évidents pour un nouvel utilisateur : (a) taper moins de 3 caractères affiche tout (pas de filtrage réel avant ce seuil), (b) entourer une tonalité de parenthèses (`"(Bb)"`) déclenche un filtre exact au lieu d'une recherche texte.

**Ce que ça implique** : soit documenter mieux (tooltip, exemple dans le placeholder — déjà partiellement fait), soit remplacer la syntaxe cachée par un vrai filtre UI (voir #1, qui rendrait ce point obsolète). Le seuil de 3 caractères mérite surtout d'être questionné : recherché-t-on vraiment à afficher "tout" en dessous de 3 caractères, ou est-ce un oubli ?

**Mon avis** : à traiter en même temps que #1 plutôt qu'isolément — une fois les filtres par tonalité/catégorie en UI, le besoin de la syntaxe `(Bb)` disparaît naturellement.

---

## 4. Mode sombre — 🟡 moyenne, 🟡 pertinent

**Ce que ça implique** : la palette actuelle (crème/ambre, `app/globals.css`) est fixe, sans gestion de `prefers-color-scheme`. Un mode sombre demanderait de redéfinir les variables CSS (`--ada-bg-1`, `--ada-ink`, etc.) sous une media query, plus une vérification de contraste sur le fond du PDF lui-même (les partitions scannées restent blanches quel que soit le thème — pas un vrai "mode sombre" pour la zone de lecture, seulement pour le chrome de l'app).

**Mon avis** : agréable mais pas indispensable — le PDF (zone principale de l'écran) reste de toute façon blanc, donc le bénéfice réel d'un mode sombre est partiel. Je ne le prioriserais pas avant les idées à plus fort usage réel (#1, #2, #10).

---

## 5. Exploiter `category` comme filtre (multi-volumes) — 🟢 faible, 🟢 pertinent

**Contexte** : le README liste "Gestion multi-volumes" en évolution future. La donnée existe déjà (`category`, ex. "Realbook", "Blues", "Bebop") et s'affiche déjà en lecture seule — il ne manque qu'un filtre UI dessus, recoupant largement #1.

**Mon avis** : à fusionner avec #1 dans l'implémentation (mêmes chips, deux champs différents) plutôt que d'en faire un chantier séparé.

---

## 6. Transposition selon l'instrument (Bb/Eb/C) — 🔴 élevée, 🟡 pertinent

**Ce que ça implique** : un vrai Real Book jazz est souvent consulté par des instrumentistes transpositeurs (saxophone alto en Eb, trompette/ténor en Bb, instruments en C). Afficher "la tonalité vue depuis mon instrument" demanderait un réglage utilisateur (instrument choisi, stocké en `localStorage`) et une vraie logique de transposition (tableau de correspondance d'intervalles, appliqué à `musical_key` pour l'affichage — **pas** au contenu du PDF scanné lui-même, qui resterait dans sa tonalité d'origine papier).

**Mon avis** : fonctionnalité réelle et différenciante pour un outil musicien, mais coûteuse à faire *correctement* (gestion des tonalités mineures, bémols/dièses enharmoniques). Je ne la lancerais que si l'usage confirme un vrai besoin récurrent de jouer avec plusieurs instruments transpositeurs sur cette bibliothèque — sinon, `musical_key` affiché tel quel (tonalité concert) suffit.

---

## 7. Authentification réelle au-delà du mot de passe unique — 🔴 élevée, 🔴 pertinence discutable

**Contexte** : voir `DOC/securite.md` pour l'analyse complète du modèle actuel (`EDIT_PASSWORD` partagé).

**Ce que ça implique** : passer à une vraie auth (NextAuth + Google OAuth, comme le projet `todo-agenda`) donnerait un historique de qui édite quoi et une vraie session, mais suppose plusieurs éditeurs — hypothèse pas confirmée ici.

**Mon avis** : je ne le ferais pas tant que Patrice reste le seul à éditer les métadonnées. Le coût (nouvelle dépendance, config OAuth, migration du mot de passe existant) dépasse largement le bénéfice pour un usage strictement personnel. À reconsidérer seulement si l'app est un jour ouverte à d'autres contributeurs (ex: un groupe de musiciens partageant la bibliothèque).

---

## 8. PWA installable + cache offline des PDF déjà consultés — 🟡 moyenne, 🟢 pertinent

**Ce que ça implique** : un manifest PWA + un service worker qui met en cache les PDF Cloudinary déjà ouverts (`Cache API` du navigateur) permettrait de consulter une partition déjà vue sans connexion — utile en répétition ou en concert dans un lieu au réseau incertain. Difficulté moyenne pour un cache basique (mise en cache passive des PDF visités) ; plus élevée si l'ambition est un mode "télécharger toute la bibliothèque pour l'offline".

**Mon avis** : c'est l'idée technique la plus alignée avec l'usage réel d'un Real Book — un musicien qui a besoin de sa partition n'a pas toujours un bon réseau sur scène. Je la mettrais devant le mode sombre (#4) dans l'ordre de priorité technique.

---

## 9. Annotations sur PDF (doigtés, respirations, marques) — 🔴 élevée, 🟡 pertinent

**Ce que ça implique** : un overlay (canvas ou SVG) par-dessus le rendu `react-pdf`, avec un outil de dessin/texte, stocké par partition (nouvelle table DB, ex. `annotations(partition_id, page, data)`). Fonctionnalité réelle pour un musicien qui prépare un morceau, mais un vrai morceau d'ingénierie : gestion du zoom/scale synchronisée entre le PDF et l'overlay, persistance, undo.

**Mon avis** : très utile *si* Patrice annote réellement ses partitions à la main aujourd'hui (papier, ou une autre appli) — sinon c'est une fonctionnalité qui résout un problème pas encore vécu. Je ne l'estimerais pas plus finement sans confirmation du besoin réel, le coût est trop élevé pour partir sur une simple supposition.

---

## 10. Playlists / sets pour préparer un concert — 🟡 moyenne, 🟢 pertinent

**Contexte** : déjà en roadmap README ("Favoris, playlists et sets").

**Ce que ça implique** : une table `sets(id, name)` + `set_partitions(set_id, partition_id, position)`, une UI de création/réordonnancement, et une vue "mode concert" qui enchaîne les partitions d'un set sans repasser par la recherche à chaque morceau.

**Mon avis** : cas d'usage réel et concret pour du jazz en groupe (préparer la setlist d'un concert à l'avance) — je le placerais juste après #1/#2 dans l'ordre de priorité, avant les idées plus exploratoires (#6, #9).

---

## 11. Impression améliorée (sélection de pages) — 🟡 moyenne, 🟡 pertinent

**Contexte** : `handlePrint` (dans `PdfViewer.tsx`/`MobileViewer.tsx`) ouvre aujourd'hui le PDF complet dans un nouvel onglet puis déclenche `window.print()` — pas de sélection de plage de pages, pas de mise en page dédiée à l'impression.

**Mon avis** : correct pour une partition d'une page, plus limitant pour une partition à plusieurs pages où on ne veut imprimer qu'un extrait. Priorité basse — le comportement actuel reste fonctionnel, juste pas raffiné.

---

## 12. Protéger `/api/sync` et limiter `/api/ai/song-insight` — ✅ fait le 2026-09-01 (pour l'essentiel)

**Ce qui a été livré** : `/api/sync` requiert désormais `?password=` (même `EDIT_PASSWORD`, comparaison timing-safe via `lib/auth.ts`). Sur `/api/ai/song-insight`, plutôt qu'une limite de fréquence, le vrai trou a été fermé à la source : la route vérifie maintenant que `partitionId` correspond à une partition réelle avant d'appeler OpenAI — un appelant ne peut plus forcer un coût illimité avec des identifiants inventés, l'abus possible est borné au nombre réel de partitions (422), chacune mise en cache après son premier appel.

**Non fait, volontairement** : pas de vraie limite de fréquence (rate limiting par IP) sur `/api/ai/song-insight` — nécessiterait un état partagé entre invocations serverless (Upstash Redis ou équivalent), jugé disproportionné une fois le risque principal (coût non borné) fermé. Un bruteforce du mot de passe sur `/api/sync`/`PUT` reste possible en théorie, non traité (voir `DOC/securite.md`).

**Détail complet** : `DOC/securite.md` (section "Corrections appliquées").

---

## Recommandation générale de séquencement

1. **À faire en premier — peu coûteux, réduit un risque réel** : #12 (protection sync/IA).
2. **Peu coûteux, forte valeur d'usage** : #1 (filtres UI) + #5 (fusion catégorie), #2 (favoris/récents).
3. **Valeur réelle, un peu plus de travail** : #10 (sets), #8 (PWA offline).
4. **À confirmer par l'usage avant de lancer** : #3 (revoir la recherche — dépend de #1), #4 (mode sombre), #11 (impression).
5. **Cher et dont le besoin réel reste à prouver** : #6 (transposition), #9 (annotations), #7 (authentification — à ne considérer que si l'app change de nature).
