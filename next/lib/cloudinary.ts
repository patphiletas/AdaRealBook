import { v2 as cloudinary } from "cloudinary";
import { sql } from "./db";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

export async function syncPartitions() {
  try {
    console.log("🔍 Récupération des fichiers sur Cloudinary...");

    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      max_results: 100,
    });

    console.log(`📂 ${result.resources.length} fichiers trouvés.`);

    for (const file of result.resources) {
      if (file.format !== "pdf") continue;

      const cleanName = file.public_id.replace(/_/g, " ");
      const parts = cleanName.split(" - ");
      const title = parts[0]?.trim() || "Titre inconnu";
      const composerName = parts[1]?.trim() || "Compositeur inconnu";
      const key = (parts[2]?.trim() || "N/C").split(" ")[0];

      const [composer] = await sql`
        INSERT INTO composers (name)
        VALUES (${composerName})
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `;

      await sql`
        INSERT INTO partitions (title, composer, composer_id, musical_key, category, name_pdf, pdf_url)
        VALUES (${title}, ${composerName}, ${composer.id}, ${key}, ${"Realbook"}, ${file.public_id}, ${file.secure_url})
        ON CONFLICT (name_pdf) DO UPDATE SET composer_id = EXCLUDED.composer_id
      `;

      console.log(`✅ ${title} (${composerName})`);
    }

    console.log("✅ Synchronisation terminée !");
  } catch (error) {
    console.error("❌ Erreur synchro :", error);
  }
}
