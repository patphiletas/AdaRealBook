import { sql } from "@/lib/db";
import { checkEditPassword, delayFailedAuth } from "@/lib/auth";
import { validatePartitionInput } from "@/lib/validation";
import { withErrorHandling } from "@/lib/withErrorHandling";

export const PUT = withErrorHandling(async (request: Request, ctx: RouteContext<"/api/partitions/[id]">) => {
  const { id } = await ctx.params;
  const { password, ...body } = await request.json();

  if (!checkEditPassword(password)) {
    await delayFailedAuth();
    return Response.json({ error: "Mot de passe incorrect" }, { status: 403 });
  }

  const validation = validatePartitionInput(body);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  const { title, composer, musical_key, category } = validation.data;

  const [comp] = await sql`
    INSERT INTO composers (name) VALUES (${composer})
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `;

  const result = await sql`
    UPDATE partitions
    SET title = ${title},
        composer = ${composer},
        composer_id = ${comp.id},
        musical_key = ${musical_key},
        category = ${category}
    WHERE id = ${id}
    RETURNING id, title, composer, musical_key, category, name_pdf, pdf_url
  `;

  if (result.length === 0) {
    return Response.json({ error: "Partition non trouvée" }, { status: 404 });
  }

  return Response.json(result[0]);
});
