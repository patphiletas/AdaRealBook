# AdaRealBook

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-111827?style=for-the-badge&logo=vercel)](https://real-book-patphiletas-projects.vercel.app/)

AdaRealBook est une application web de consultation de partitions jazz façon Real Book.
Le projet combine un front React/Vite pour la lecture des PDF, une API Express pour exposer les partitions, une base PostgreSQL sur Neon, un stockage Cloudinary pour les fichiers, et une fiche IA générée à la demande pour chaque morceau.

## Aperçu

- Recherche de morceaux par titre, compositeur, catégorie ou tonalité
- Affichage des partitions PDF dans une interface desktop en split view
- Vue mobile dédiée avec lecture, zoom, impression et téléchargement
- Synchronisation des partitions depuis Cloudinary vers PostgreSQL
- Génération d'une fiche IA avec biographie, tonalité, grille et anecdotes

## Stack

- Frontend : React 19, TypeScript, Vite, Tailwind CSS, `react-pdf`
- Backend : Node.js, Express 5
- Base de données : PostgreSQL via Neon
- Stockage : Cloudinary
- IA : OpenAI Responses API

## Structure

```text
AdaRealBook/
├── front/      # interface utilisateur React + Vite
├── back/       # API Express + synchro Cloudinary/Postgres
└── README.md
```

## Installation

Prérequis :

- Node.js 20+ recommandé
- Un projet Cloudinary avec des PDF disponibles
- Une base PostgreSQL accessible
- Une clé API OpenAI

Installer les dépendances :

```bash
cd front && npm install
cd ../back && npm install
```

## Variables d'environnement

Créer les fichiers suivants :

`front/.env`

```env
VITE_API_URL=http://localhost:3001
```

`back/.env`

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4.1-mini
PORT=3001
```

## Lancer le projet

Dans un terminal pour l'API :

```bash
cd back
npm run dev
```

Dans un second terminal pour le front :

```bash
cd front
npm run dev
```

Application disponible sur :

- Front : `http://127.0.0.1:5173`
- API : `http://localhost:3001`

## Endpoints utiles

- `GET /api/partitions`
  Retourne la liste des partitions triées par titre.

- `POST /api/ai/song-insight`
  Génère une fiche IA pour un morceau à partir de son titre et de son compositeur.

Exemple de payload :

```json
{
  "title": "Autumn Leaves",
  "composer": "Joseph Kosma"
}
```

## Fonctionnement

Au démarrage du back, l'application interroge Cloudinary, récupère les PDF disponibles, nettoie leurs métadonnées à partir du nom de fichier, puis insère les partitions en base si elles n'existent pas déjà.

Côté front :

- la liste des morceaux est chargée depuis l'API
- un morceau sélectionné ouvre le PDF correspondant
- l'interface s'adapte entre desktop et mobile
- la fiche IA est ouverte à la demande pour éviter les appels inutiles

## État actuel

Le projet est pensé comme une base fonctionnelle pour un Real Book personnel :

- catalogue de partitions
- consultation fluide
- enrichissement éditorial par IA

Les prochaines évolutions naturelles seraient :

- édition des métadonnées depuis l'interface
- filtres plus avancés
- gestion multi-volumes
- favoris, playlists ou sets
- authentification

## Scripts

Frontend :

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend :

```bash
npm run dev
npm start
```

## Notes

- Le backend dépend d'un accès réseau effectif à Cloudinary, Neon et OpenAI.
- Les partitions sont attendues dans Cloudinary avec un nom exploitable par l'API, de type :
  `Titre - Compositeur - Tonalite.pdf`
- La route `PUT /api/partitions/:id` est présente mais encore peu exploitée côté interface.

## Auteur

Projet développé autour d'une bibliothèque personnelle de partitions jazz, avec une interface pensée pour la consultation rapide sur desktop et mobile.
