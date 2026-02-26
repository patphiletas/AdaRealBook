import express from 'express';
import cors from 'cors';
import postgres from 'postgres';
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config';

const app = express();
const PORT = 3001;

// --- CONFIGURATION ---


app.use(cors({
  origin: ['https://ada-real-book.vercel.app', 'http://localhost:5173'] 
}));
app.use(express.json());


const sql = postgres(process.env.DATABASE_url, { ssl: 'require' });


cloudinary.config({ 
    cloud_name: 'dpnudoyxb', 
    api_key: '392895888158834', 
    api_secret: 'awLuzuRDdU3nSVk30pwls-hL8I4' 
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

                // Nettoyage du suffixe aléatoire de Cloudinary sur la tonalité (ex: "C abc123" -> "C")
                let key = keySuffix.split(' ')[0];

                console.log(`➕ Ajout en base : ${title} (${composer})`);

                // Insertion dans Neon (si le public_id existe déjà, on ne fait rien)
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