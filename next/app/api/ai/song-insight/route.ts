import { sql } from "@/lib/db";
import { generateSongInsight } from "@/lib/openai";
import { withErrorHandling } from "@/lib/withErrorHandling";
import { isValidPartitionId } from "@/lib/validation";

export const POST = withErrorHandling(async (request: Request) => {
  const { partitionId } = await request.json();

  if (!isValidPartitionId(partitionId)) {
    return Response.json({ error: "Le champ partitionId est requis." }, { status: 400 });
  }

  const [partition] = await sql`
    SELECT p.id, p.title, c.name AS composer
    FROM partitions p
    LEFT JOIN composers c ON c.id = p.composer_id
    WHERE p.id = ${partitionId}
  `;

  if (!partition) {
    return Response.json({ error: "Partition non trouvée." }, { status: 404 });
  }

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

  console.log(`🤖 Génération OpenAI pour "${partition.title}" (${partition.composer})`);
  const insight = await generateSongInsight({ title: partition.title, composer: partition.composer });

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
}, "Impossible de générer les anecdotes IA.");
