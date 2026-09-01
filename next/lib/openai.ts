const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

export interface SongInsightResult {
  composerWord: string;
  tonalite: string;
  grille: string;
  anecdotes: string[];
}

function extractResponseText(responseJson: any): string {
  if (typeof responseJson?.output_text === "string" && responseJson.output_text.trim()) {
    return responseJson.output_text;
  }
  const chunks: string[] = [];
  const outputs = Array.isArray(responseJson?.output) ? responseJson.output : [];
  for (const outputItem of outputs) {
    const content = Array.isArray(outputItem?.content) ? outputItem.content : [];
    for (const contentItem of content) {
      if (contentItem?.type === "output_text" && typeof contentItem.text === "string") {
        chunks.push(contentItem.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function normalizeInsight(data: any): SongInsightResult | null {
  const composerWord = typeof data?.composerWord === "string" ? data.composerWord.trim() : "";
  const tonalite = typeof data?.tonalite === "string" ? data.tonalite.trim() : "";
  const grille = typeof data?.grille === "string" ? data.grille.trim() : "";
  const anecdotesRaw = Array.isArray(data?.anecdotes) ? data.anecdotes : [];

  const anecdotes = anecdotesRaw
    .filter((item: unknown) => typeof item === "string")
    .map((item: string) => item.trim())
    .filter(Boolean)
    .slice(0, 6);

  if (!composerWord || !tonalite || !grille || anecdotes.length < 3 || anecdotes.length > 6) {
    return null;
  }

  return { composerWord, tonalite, grille, anecdotes };
}

export async function generateSongInsight({ title, composer }: { title: string; composer: string }): Promise<SongInsightResult> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY manquant dans les variables d'environnement.");
  }

  const payload = {
    model: OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: "Tu es un assistant expert en histoire du jazz. Réponds uniquement en JSON valide." }],
      },
      {
        role: "user",
        content: [{
          type: "input_text",
          text: `Morceau: "${title}"\nCompositeur principal: "${composer}"\n\nRenvoie un objet JSON avec exactement:\n- composerWord: une petite biographie du compositeur principal avec un lien Wikipedia en texte brut\n- tonalite: tonalité principale du morceau (ex: "F minor", "Bb major"), ou "Incertaine" si non confirmée\n- grille: la grille harmonique en texte brut sur plusieurs lignes (format lisible, sans markdown)\n- anecdotes: un tableau de 3 à 6 anecdotes sur la genèse du morceau\n\nRègles:\n- Si une information n'est pas certaine, indique-le explicitement.\n- Pas de markdown.\n- Réponds en français.`,
        }],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "song_insight",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            composerWord: { type: "string" },
            tonalite: { type: "string" },
            grille: { type: "string" },
            anecdotes: { type: "array", minItems: 3, maxItems: 6, items: { type: "string" } },
          },
          required: ["composerWord", "tonalite", "grille", "anecdotes"],
        },
        strict: true,
      },
    },
    max_output_tokens: 500,
    temperature: 0.5,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI a répondu ${response.status}: ${errorBody}`);
  }

  const responseJson = await response.json();
  const responseText = extractResponseText(responseJson);

  if (!responseText) throw new Error("Réponse OpenAI vide ou non exploitable.");

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("Réponse OpenAI non JSON.");
  }

  const normalized = normalizeInsight(parsed);
  if (!normalized) throw new Error("Format JSON invalide reçu depuis OpenAI.");

  return normalized;
}
