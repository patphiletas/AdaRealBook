import { sql } from "@/lib/db";
import { generateSongInsight } from "@/lib/openai";

export async function POST(request: Request) {
  const { partitionId, title, composer } = await request.json();

  if (!partitionId || typeof title !== "string" || !title.trim() || typeof composer !== "string" || !composer.trim()) {
    return Response.json({ error: "Les champs partitionId, title et composer sont requis." }, { status: 400 });
  }

  try {
    const cached = await sql`
      SELECT si.composer_word, si.tonalite, si.grille,
             array_agg(a.content ORDER BY a.position) AS anecdotes
      FROM song_insights si
      JOIN anecdotes a ON a.insight_id = si.id
      WHERE si.partition_id = ${partitionId}
      GROUP BY si.id
    `;

    if (cached.length > 0) {
      console.log(`💾 Cache hit pour partition ${partitionId}`);
      const row = cached[0];
      return Response.json({
        composerWord: row.composer_word,
        tonalite: row.tonalite,
        grille: row.grille,
        anecdotes: row.anecdotes,
      });
    }

    console.log(`🤖 Génération OpenAI pour "${title}" (${composer})`);
    const insight = await generateSongInsight({ title: title.trim(), composer: composer.trim() });

    const [savedInsight] = await sql`
      INSERT INTO song_insights (partition_id, composer_word, tonalite, grille)
      VALUES (${partitionId}, ${insight.composerWord}, ${insight.tonalite}, ${insight.grille})
      RETURNING id
    `;

    for (let i = 0; i < insight.anecdotes.length; i++) {
      await sql`
        INSERT INTO anecdotes (insight_id, content, position)
        VALUES (${savedInsight.id}, ${insight.anecdotes[i]}, ${i})
      `;
    }

    console.log(`💾 Insight sauvegardé pour partition ${partitionId}`);
    return Response.json(insight);
  } catch (error) {
    console.error("Erreur génération insight:", error);
    return Response.json({ error: "Impossible de générer les anecdotes IA." }, { status: 500 });
  }
}
