# AGENTS.md — AdaRealBook (racine du dépôt)

**Le projet se trouve dans [`next/`](next/).** C'est le seul projet du dépôt depuis la migration Express + Vite → Next.js du 2026-09-01.

Avant toute modification, lire **[`next/AGENTS.md`](next/AGENTS.md)** : règles du projet, pièges connus, historique, et la documentation dans `next/DOC/`. Toutes les commandes (`npm install`, `npm run dev`, `npm test`, `npm run build`) se lancent depuis `next/`.

À la racine ne restent que le `README.md` du dépôt, les captures (`assets/`, `thumbnail.png`) et ce fichier.

## Rappels essentiels

- Une question n'est pas une demande de code : répondre ou proposer, et attendre un feu vert explicite avant de modifier le code.
- Documenter chaque changement dans `next/DOC/` (roadmap, sécurité, tests…) et garder `next/AGENTS.md` à jour.
- Production : https://real-book-patphiletas.vercel.app (Vercel suit la branche `main`).
- `POST /api/sync` (synchro Cloudinary → base) et `PUT /api/partitions/:id` sont protégées par `EDIT_PASSWORD`, toujours dans le corps JSON, jamais dans l'URL.
