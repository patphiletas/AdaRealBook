<div align="center">

<img src="assets/jazz-banner.jpg" alt="Jazz saxophone" width="300" style="border-radius: 12px;" />

# 🎷 AdaRealBook

**Une bibliothèque de partitions jazz, façon Real Book.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://real-book-patphiletas-projects.vercel.app/)
&nbsp;
[![Next.js](https://img.shields.io/badge/Next.js%2016-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
&nbsp;
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

*Dernière mise à jour par l'agent : 2026-09-01 22:13*

---

## Aperçu

<div align="center">
  <img src="thumbnail.png" alt="Capture d'écran de l'application" width="800" />
</div>

<br/>

AdaRealBook est une application web de consultation de partitions jazz, en **Next.js** (App Router) : UI de lecture des PDF et API (Route Handlers) dans un seul projet, une base PostgreSQL sur Neon, un stockage Cloudinary, et une fiche IA générée à la demande pour chaque morceau.

> **Le projet vit dans [`next/`](next/).** Il remplace une ancienne architecture (front Vite séparé + backend Express sur Render) migrée puis supprimée du dépôt le 2026-09-01 — voir [`next/DOC/roadmap.md`](next/DOC/roadmap.md) pour l'historique.

---

## Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 🔍 Recherche | Par titre, compositeur, catégorie ou tonalité |
| 🖥️ Split view | Liste à gauche, partition PDF à droite (desktop) |
| 📱 Vue mobile | Lecture, zoom, impression et téléchargement |
| 🔄 Synchronisation | Import automatique des PDF depuis Cloudinary |
| 🤖 Fiche IA | Biographie, tonalité, grille et anecdotes générées par OpenAI |
| 💾 Cache IA | Les fiches générées sont stockées en BDD — affichage instantané dès la 2e ouverture |
| ✏️ Édition | Modification des métadonnées (titre, compositeur, tonalité, catégorie) protégée par mot de passe |
| 🔍 Fit-to-view | La partition s'affiche en entier à l'ouverture, zoom libre ensuite |

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), TypeScript |
| UI | React 19, Tailwind CSS v4, `react-pdf` |
| API | Route Handlers Next.js (même projet que l'UI, plus de serveur séparé) |
| Base de données | PostgreSQL via [Neon](https://neon.tech) |
| Stockage | [Cloudinary](https://cloudinary.com) |
| IA | OpenAI Responses API |
| Tests | Vitest (tests unitaires) |
| Hébergement | [Vercel](https://vercel.com) (front + API dans le même déploiement) |

---

## Structure du projet

```
AdaRealBook/
├── .github/workflows/    # CI (build + tests sur chaque push/PR)
├── next/                 # Le projet — voir next/README.md pour le détail
│   ├── app/
│   │   ├── page.tsx          # UI principale (Client Component)
│   │   └── api/               # Route Handlers : partitions, ai/song-insight, sync
│   ├── components/           # SearchList, PdfViewer, MobileViewer, EditMetadataDialog
│   ├── lib/                   # db.ts, cloudinary.ts, openai.ts, pdfWorker.ts, auth.ts
│   ├── DOC/                    # Documentation détaillée (voir plus bas)
│   └── AGENTS.md                # Instructions pour tout agent IA qui reprend ce code
└── assets/               # Images du README
```

---

## Schéma de base de données

```
composers         partitions              song_insights       anecdotes
─────────         ──────────              ─────────────       ─────────
id                id                      id                  id
name ──────────── composer_id (FK)        partition_id (FK)   insight_id (FK)
                  title                   composer_word       content
                  musical_key             tonalite            position
                  category                grille
                  name_pdf                created_at
                  pdf_url
```

> Un insight OpenAI n'est généré **qu'une seule fois** par morceau puis mis en cache dans `song_insights`.

---

## Installation

```bash
cd next
npm install
```

**`next/.env.local`**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
EDIT_PASSWORD=your_edit_password
```

---

## Lancement

```bash
cd next
npm run dev      # http://localhost:3000
npm run build    # avant tout déploiement
npm test         # tests unitaires (Vitest)
```

Un seul serveur, un seul port — plus de front/API séparés à lancer.

---

## Endpoints API

| Méthode | Route | Description |
|---|---|---|
| `GET` | `/api/partitions` | Liste des partitions avec compositeur |
| `POST` | `/api/ai/song-insight` | Fiche IA (cache BDD en priorité) |
| `PUT` | `/api/partitions/:id` | Modifier titre / compositeur / tonalité |
| `GET` | `/api/sync` | Déclencher une synchro Cloudinary manuellement |

**Payload `POST /api/ai/song-insight` :**
```json
{
  "partitionId": 42
}
```

`title`/`composer` sont lus depuis la base à partir de `partitionId` (la route vérifie que la partition existe avant d'appeler OpenAI).

---

## Prochaines évolutions

- [x] Édition des métadonnées depuis l'interface
- [x] Migration vers un Next.js unique (front + API), coupure du backend Express/Render
- [x] Suppression de `front/` et `back/`, CI (build + tests sur chaque push)
- [ ] Filtres avancés en UI (tonalité, catégorie) — voir [`next/DOC/features.md`](next/DOC/features.md) #1
- [ ] Favoris / dernières partitions consultées — voir [`next/DOC/features.md`](next/DOC/features.md) #2
- [ ] Gestion multi-volumes
- [ ] Favoris, playlists et sets
- [ ] Authentification

Analyse détaillée (difficulté, pertinence, avis) de ces pistes et d'autres dans [`next/DOC/features.md`](next/DOC/features.md).

---

## Documentation complémentaire

Toute la documentation détaillée du projet vit dans [`next/`](next/) (le projet actif) :

| Fichier | Contenu |
|---|---|
| [next/AGENTS.md](next/AGENTS.md) | Instructions pour tout agent IA (Claude ou autre) qui reprend ce projet |
| [next/DOC/error.md](next/DOC/error.md) | Historique des bugs/blocages rencontrés (dont la migration Vercel) et leur résolution |
| [next/DOC/test.md](next/DOC/test.md) | État des tests (21 tests unitaires Vitest), checklist manuelle, plan de tests pour la suite |
| [next/DOC/roadmap.md](next/DOC/roadmap.md) | Historique des évolutions + pistes identifiées |
| [next/DOC/features.md](next/DOC/features.md) | Analyse faisabilité/difficulté/pertinence des idées d'amélioration UI/UX/technique |
| [next/DOC/securite.md](next/DOC/securite.md) | Modèle de menace, choix et limites de sécurité |
| [next/DOC/refacto.md](next/DOC/refacto.md) | Dette technique identifiée, faite ou à faire |

Cette documentation est vivante : **elle doit être mise à jour à chaque modification du projet**, pas seulement relue de temps en temps (voir `next/AGENTS.md`).

---

<div align="center">

Développé autour d'une bibliothèque personnelle de partitions jazz · Patrice Philétas 2026

<sub>Photo : <a href="https://commons.wikimedia.org/wiki/File:New_Orleans_Jazz_Fest_2011_saxophone_and_guitar.jpg">Tulane Public Relations</a> · CC BY 2.0 · New Orleans Jazz Fest 2011</sub>

</div>
