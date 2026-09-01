import { sql } from "@/lib/db";
import { withErrorHandling } from "@/lib/withErrorHandling";

export const GET = withErrorHandling(async () => {
  const data = await sql`
    SELECT p.id, p.title, c.name AS composer, p.musical_key, p.category, p.name_pdf, p.pdf_url
    FROM partitions p
    LEFT JOIN composers c ON c.id = p.composer_id
    ORDER BY p.title ASC
  `;
  return Response.json(data);
}, "Erreur lors de la lecture de la base de données");
