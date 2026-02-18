import { useState, useEffect } from 'react';

// 1. Interface alignée exactement sur ta table Neon
interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  page_number: number; // Correspond à la colonne integer de ta capture Neon
  category: string;
}

export default function App() {
  // 2. États pour les données et la recherche
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [search, setSearch] = useState("");

  // 3. Chargement des données
  useEffect(() => {
    fetch("http://localhost:3001/api/partitions")
      .then(res => res.json())
      .then(data => {
        console.log("Données reçues de Neon :", data);
        setPartitions(data);
      })
      .catch(err => console.error("Erreur de connexion au serveur :", err));
  }, []);

  // 4. Logique de filtrage (Tonalité entre parenthèses ou Recherche texte)
  const resultats = partitions.filter(p => {
    const saisie = search.trim().toLowerCase();
    if (!saisie) return true;

    // Recherche par tonalité ex: "(Eb)"
    if (saisie.startsWith("(") && saisie.endsWith(")")) {
      const ton = saisie.replace(/[()]/g, "");
      return p.musical_key?.toLowerCase() === ton;
    }

    // Recherche texte (minimum 3 caractères)
    if (saisie.length < 3) return true;
    return (
      p.title.toLowerCase().includes(saisie) ||
      p.composer.toLowerCase().includes(saisie) ||
      p.category.toLowerCase().includes(saisie)
    );
  });

  // 5. Fonction d'ouverture du PDF avec correctif pour Chrome sur Mac
  const ouvrirPartition = (page: number) => {
    const urlBase = "https://res.cloudinary.com/dpnudoyxb/image/upload/v1771325971/Real-Book-clear-1-175_jmujxr.pdf";
    
    if (!page) {
      alert("Aucun numéro de page défini pour ce morceau.");
      return;
    }

    const urlComplete = `${urlBase}#page=${page}`;
    console.log("Tentative d'ouverture page PDF :", page);

    // Ouverture de l'onglet
    const newWindow = window.open(urlComplete, "_blank");

    // Correctif Chrome : On force la redirection vers l'ancre après un court délai
    // car Chrome ignore souvent le #page au premier chargement
    if (newWindow) {
      setTimeout(() => {
        try {
          newWindow.location.href = urlComplete;
        } catch (e) {
          console.warn("Le navigateur a bloqué la redirection automatique.");
        }
      }, 700);
    }
  };

  // 6. Rendu de l'interface
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header>
        <h2 style={{ color: '#2c3e50' }}>My Real Book 🎷</h2>
        <p style={{ color: '#7f8c8d' }}>Sélection du Volume 1</p>
      </header>
      
      <input 
        type="text" 
        placeholder="Titre, compositeur... ou (Bb) pour la tonalité"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ 
          width: '100%', 
          padding: '15px', 
          fontSize: '16px', 
          marginBottom: '20px', 
          borderRadius: '8px', 
          border: '1px solid #ddd',
          boxSizing: 'border-box'
        }}
      />

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {resultats.map(item => (
          <li 
            key={item.id} 
            onClick={() => ouvrirPartition(item.page_number)}
            style={{ 
              padding: '15px', 
              borderBottom: '1px solid #eee', 
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#fff'
            }}
            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
            onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#fff')}
          >
            <div>
              <strong style={{ fontSize: '1.1em' }}>{item.title}</strong>
              <br />
              <span style={{ color: '#666' }}>{item.composer} • ({item.musical_key})</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ color: '#3498db', fontWeight: 'bold' }}>p. {item.page_number}</span>
              <br />
              <em style={{ color: '#95a5a6', fontSize: '0.85em' }}>{item.category}</em>
            </div>
          </li>
        ))}
      </ul>

      {resultats.length === 0 && (
        <p style={{ textAlign: 'center', color: '#95a5a6', marginTop: '20px' }}>
          Aucun morceau trouvé pour "{search}"
        </p>
      )}
    </div>
  );
}