<div align="center">

<img src="assets/jazz-banner.jpg" alt="Jazz saxophone" width="300" style="border-radius: 12px;" />

# 🎷 AdaRealBook

**Une bibliothèque de partitions jazz, façon Real Book.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel)](https://real-book-patphiletas-projects.vercel.app/)
&nbsp;
[![React](https://img.shields.io/badge/React%2019-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
&nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
&nbsp;
[![Express](https://img.shields.io/badge/Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
&nbsp;
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

</div>

---

## Aperçu

<div align="center">
  <img src="thumbnail.png" alt="Capture d'écran de l'application" width="800" />
</div>

<br/>

AdaRealBook est une application web de consultation de partitions jazz. Elle combine un front React/Vite pour la lecture des PDF, une API Express, une base PostgreSQL sur Neon, un stockage Cloudinary, et une fiche IA générée à la demande pour chaque morceau.

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
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, `react-pdf` |
| Backend | Node.js, Express 5 |
| Base de données | PostgreSQL via [Neon](https://neon.tech) |
| Stockage | [Cloudinary](https://cloudinary.com) |
| IA | OpenAI Responses API |

---

## Structure du projet

```
AdaRealBook/
├── front/          # Interface React + Vite
│   └── src/
│       ├── components/   # SearchList, PdfViewer, MobileViewer
│       ├── types/        # Interfaces TypeScript
│       └── App.tsx       # Composant racine
├── back/
│   └── index.js          # API Express + sync Cloudinary + cache IA
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
# Dépendances
cd front && npm install
cd ../back && npm install
```

**`front/.env`**
```env
VITE_API_URL=http://localhost:3001
```

**`back/.env`**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
PORT=3001
```

---

## Lancement

```bash
# Terminal 1 — API
cd back && npm run dev

# Terminal 2 — Front
cd front && npm run dev
```

- Front : `http://127.0.0.1:5173`
- API : `http://localhost:3001`

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
  "partitionId": 42,
  "title": "Autumn Leaves",
  "composer": "Joseph Kosma"
}
```

---

## Prochaines évolutions

- [x] Édition des métadonnées depuis l'interface
- [ ] Filtres avancés (tonalité, époque, style)
- [ ] Gestion multi-volumes
- [ ] Favoris, playlists et sets
- [ ] Authentification

---

<div align="center">

Développé autour d'une bibliothèque personnelle de partitions jazz · Patrice Philétas 2026

<sub>Photo : <a href="https://commons.wikimedia.org/wiki/File:New_Orleans_Jazz_Fest_2011_saxophone_and_guitar.jpg">Tulane Public Relations</a> · CC BY 2.0 · New Orleans Jazz Fest 2011</sub>

</div>
