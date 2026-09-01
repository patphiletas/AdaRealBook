import { sql } from "@/lib/db";
import { checkEditPassword } from "@/lib/auth";

const MAX_TITLE_COMPOSER_LENGTH = 200;
const MAX_CATEGORY_LENGTH = 100;
const MAX_MUSICAL_KEY_LENGTH = 20;

export async function PUT(request: Request, ctx: RouteContext<"/api/partitions/[id]">) {
  const { id } = await ctx.params;
  const { password, title, composer, musical_key, category } = await request.json();

  if (!checkEditPassword(password)) {
    return Response.json({ error: "Mot de passe incorrect" }, { status: 403 });
  }

  if (!title?.trim() || !composer?.trim()) {
    return Response.json({ error: "Titre et compositeur obligatoires" }, { status: 400 });
  }

  if (
    title.trim().length > MAX_TITLE_COMPOSER_LENGTH ||
    composer.trim().length > MAX_TITLE_COMPOSER_LENGTH ||
    (musical_key && musical_key.trim().length > MAX_MUSICAL_KEY_LENGTH) ||
    (category && category.trim().length > MAX_CATEGORY_LENGTH)
  ) {
    return Response.json({ error: "Un ou plusieurs champs dépassent la longueur autorisée" }, { status: 400 });
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
