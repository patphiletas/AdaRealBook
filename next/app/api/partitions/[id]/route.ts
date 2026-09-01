import { sql } from "@/lib/db";

export async function PUT(request: Request, ctx: RouteContext<"/api/partitions/[id]">) {
  const { id } = await ctx.params;
  const { password, title, composer, musical_key, category } = await request.json();

  const expectedPassword = (process.env.EDIT_PASSWORD || "").trim();
  if (!expectedPassword || !password || password !== expectedPassword) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 403 });
  }

  if (!title?.trim() || !composer?.trim()) {
    return Response.json({ error: "Titre et compositeur obligatoires" }, { status: 400 });
  }

  try {
    const [comp] = await sql`
      INSERT INTO composers (name) VALUES (${composer.trim()})
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id
    `;

    const result = await sql`
      UPDATE partitions
      SET title = ${title.trim()},
          composer = ${composer.trim()},
          composer_id = ${comp.id},
          musical_key = ${musical_key?.trim() || null},
          category = ${category?.trim() || null}
      WHERE id = ${id}
      RETURNING id, title, composer, musical_key, category, name_pdf, pdf_url
    `;

    if (result.length === 0) {
      return Response.json({ error: "Partition non trouvée" }, { status: 404 });
    }

    return Response.json(result[0]);
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
