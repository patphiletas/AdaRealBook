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

// --- ROUTES API (POUR LE FRONT) ---

// Route pour récupérer toutes les partitions
app.get('/api/partitions', async (req, res) => {
    try {
        const data = await sql`SELECT * FROM partitions ORDER BY title ASC`;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Erreur lors de la lecture de la base de données" });
    }
});

app.put("/partitions/:id", async (req, res) => {
  const { id } = req.params;
  const { title, composer, musical_key, category } = req.body;

  try {
    const result = await pool.query(
      `UPDATE partitions
       SET title = $1,
           composer = $2,
           musical_key = $3,
           category = $4
       WHERE id = $5
       RETURNING *`,
      [title, composer, musical_key, category, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Partition non trouvée" });
    }

    res.json(result.rows[0]);

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