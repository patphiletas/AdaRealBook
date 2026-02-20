import { useState, useEffect } from 'react';

interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  name_pdf: string;
  category: string;
}

const CLOUDINARY_BASE = "https://res.cloudinary.com/dpnudoyxb/image/upload/";

export default function App() {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:3001/api/partitions")
      .then(res => res.json())
      .then(data => setPartitions(data))
      .catch(err => console.error("Erreur :", err));
  }, []);

  const resultats = partitions.filter(p => {
    const saisie = search.trim().toLowerCase();
    if (!saisie) return true;
    if (saisie.startsWith("(") && saisie.endsWith(")")) {
      const ton = saisie.replace(/[()]/g, "");
      return p.musical_key?.toLowerCase() === ton;
    }
    if (saisie.length < 3) return true;
    return (
      p.title.toLowerCase().includes(saisie) ||
      p.composer.toLowerCase().includes(saisie) ||
      p.category.toLowerCase().includes(saisie)
    );
  });

  const ouvrirPartition = (name_pdf: string) => {
    if (!name_pdf) return;
    const url = `${CLOUDINARY_BASE}/${name_pdf}.pdf`;
    window.open(url, "_blank");
  };

  return (
    <div className="max-w-3xl mx-auto p-5 font-sans">
      <header className="mb-6">
        <h2 className="text-3xl font-bold text-slate-800">My Real Book 🎷</h2>
        <p className="text-slate-500">Sélection du Volume 1</p>
      </header>

      <input
        type="text"
        placeholder="Titre, compositeur... ou (Bb) pour la tonalité"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-4 text-lg border border-slate-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all mb-5"
      />

      <ul className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {resultats.map(item => (
          <li
            key={item.id}
            onClick={() => ouvrirPartition(item.name_pdf)}
            className="p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div>
              <strong className="text-lg text-slate-900 block">{item.title}</strong>
              <span className="text-slate-500">{item.composer} • ({item.musical_key})</span>
            </div>
            <div className="text-right">
              <em className="text-slate-400 text-sm not-italic">{item.category}</em>
            </div>
          </li>
        ))}
      </ul>

      {resultats.length === 0 && (
        <p className="text-center text-slate-400 mt-10 italic">
          Aucun morceau trouvé pour "{search}"
        </p>
      )}
    </div>
  );
}
