import { sql } from "@/lib/db";

export async function GET() {
  try {
    const data = await sql`
      SELECT p.id, p.title, c.name AS composer, p.musical_key, p.category, p.name_pdf, p.pdf_url
      FROM partitions p
      LEFT JOIN composers c ON c.id = p.composer_id
      ORDER BY p.title ASC
    `;
    return Response.json(data);
  } catch {
    return Response.json({ error: "Erreur lors de la lecture de la base de données" }, { status: 500 });
  }
}
