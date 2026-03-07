import express from 'express';
import cors from 'cors';
import postgres from 'postgres';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---

app.use(cors());
app.use(express.json());

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});



const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

console.log("OpenAI key loaded:", !!process.env.OPENAI_API_KEY);

function extractResponseText(responseJson) {
  if (typeof responseJson?.output_text === 'string' && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }

  const chunks = [];
  const outputs = Array.isArray(responseJson?.output) ? responseJson.output : [];

  for (const outputItem of outputs) {
    const content = Array.isArray(outputItem?.content) ? outputItem.content : [];
    for (const contentItem of content) {
      if (contentItem?.type === 'output_text' && typeof contentItem.text === 'string') {
        chunks.push(contentItem.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

function normalizeInsight(data) {
  const composerWord = typeof data?.composerWord === 'string' ? data.composerWord.trim() : '';
  const anecdotesRaw = Array.isArray(data?.anecdotes) ? data.anecdotes : [];

  const anecdotes = anecdotesRaw
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (!composerWord || anecdotes.length !== 3) {
    return null;
  }

  return {
    composerWord,
    anecdotes
  };
}

async function generateSongInsight({ title, composer }) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY manquant dans les variables d\'environnement.');
  }

  const payload = {
    model: OPENAI_MODEL,
    input: [
      {
        role: 'system',
        content: [
          {
            type: 'input_text',
            text: 'Tu es un assistant expert en histoire du jazz. Réponds uniquement en JSON valide.'
          }
        ]
      },
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Morceau: "${title}"\nCompositeur principal: "${composer}"\n\nRenvoie un objet JSON avec exactement:\n- composerWord: un seul mot en français qui caractérise le compositeur\n- anecdotes: un tableau de 3 anecdotes courtes sur la genèse du morceau\n\nRègles:\n- Si l'information n'est pas certaine, indique-le dans l'anecdote avec prudence (ex: "selon plusieurs sources").\n- Pas de markdown.`
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'song_insight',
        schema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            composerWord: { type: 'string' },
            anecdotes: {
              type: 'array',
              minItems: 3,
              maxItems: 3,
              items: { type: 'string' }
            }
          },
          required: ['composerWord', 'anecdotes']
        },
        strict: true
      }
    },
    max_output_tokens: 250,
    temperature: 0.5
  };

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI a répondu ${response.status}: ${errorBody}`);
  }

  const responseJson = await response.json();
  const responseText = extractResponseText(responseJson);

  if (!responseText) {
    throw new Error('Réponse OpenAI vide ou non exploitable.');
  }

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error('Réponse OpenAI non JSON.');
  }

  const normalized = normalizeInsight(parsed);
  if (!normalized) {
    throw new Error('Format JSON invalide reçu depuis OpenAI.');
  }

  return normalized;
}

async function syncPartitions() {
    try {
        console.log("🔍 Étape 1 : Récupération des fichiers sur Cloudinary...");
        
        const result = await cloudinary.api.resources({
            type: 'upload',
            resource_type: 'image', 
            max_results: 100
        });

        console.log(`📂 ${result.resources.length} fichiers trouvés.`);

        for (const file of result.resources) {
           
            if (file.format === 'pdf') {
                
                // Nettoyage du nom : remplace les "_" de Cloudinary par des espaces
                let cleanName = file.public_id.replace(/_/g, ' ');

                // Découpage du nom : "Titre - Compositeur - Tonalité"
                let parts = cleanName.split(' - ');

                let title = parts[0]?.trim() || "Titre inconnu";
                let composer = parts[1]?.trim() || "Compositeur inconnu";
                let keySuffix = parts[2]?.trim() || "N/C";

                // Nettoyage du suffixe aléatoire de Cloudinary sur la tonalité 
                let key = keySuffix.split(' ')[0];

                console.log(`➕ Ajout en base : ${title} (${composer})`);

                // Insertion dans Neon 
                await sql`
                INSERT INTO partitions (title, composer, musical_key, category, name_pdf, pdf_url)
                VALUES (${title}, ${composer}, ${key}, ${"Realbook"}, ${file.public_id}, ${file.secure_url})
                ON CONFLICT (name_pdf) DO NOTHING;
                `;
            
            }
        }
        console.log("✅ Synchronisation terminée avec succès !");
    } catch (error) {
        console.error("❌ Erreur lors de la synchro :", error);
    }
}

// --- ROUTES POUR LE FRONT ---

// Route pour récupérer toutes les partitions
app.get('/api/partitions', async (req, res) => {
    try {
        const data = await sql`SELECT * FROM partitions ORDER BY title ASC`;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la lecture de la base de données" });
    }
});

app.post('/api/ai/song-insight', async (req, res) => {
  const { title, composer } = req.body || {};

  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Le champ title est requis.' });
  }

  if (typeof composer !== 'string' || !composer.trim()) {
    return res.status(400).json({ error: 'Le champ composer est requis.' });
  }

  try {
    const insight = await generateSongInsight({
      title: title.trim(),
      composer: composer.trim()
    });

    res.json(insight);
  } catch (error) {
    console.error('Erreur génération insight:', error);
    res.status(500).json({ error: 'Impossible de générer les anecdotes IA.' });
  }
});


// Route pour corriger titre / compositeur / musica_Key  (encore inutilisée)

app.put("/api/partitions/:id", async (req, res) => {
  const { id } = req.params;
  const { title, composer, musical_key, category } = req.body;

  try {
    const result = await sql`
      UPDATE partitions
      SET title = ${title},
          composer = ${composer},
          musical_key = ${musical_key},
          category = ${category}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Partition non trouvée" });
    }

    res.json(result[0]);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour déclencher une nouvelle synchro manuellement via le navigateur
app.get('/api/sync', async (req, res) => {
    await syncPartitions();
    res.json({ message: "Synchro lancée, vérifie ton terminal !" });
});

// --- LANCEMENT DU SERVEUR ---

app.listen(PORT, () => {
    console.log(`-----------------------------------------------`);
    console.log(`🎷 RealBook API lancée sur : http://localhost:${PORT}`);
    console.log(`📄 Route JSON : http://localhost:${PORT}/api/partitions`);
    console.log(`-----------------------------------------------`);
    
    syncPartitions(); 
});
