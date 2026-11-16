import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Image de partage (LinkedIn, messageries…) : fond crème, saxophone et titre en Fraunces,
// comme l'en-tête du site. Sans elle, LinkedIn affichait une vignette vide.
export const alt = "My Real Book — partitions de jazz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TITRE = "My Real Book";

const SURTITRE = "Jazz library";
const TEXTE = "Les standards du Real Book : recherche par titre, compositeur ou tonalité, mode scène, fiche IA.";

// Polices du site (chargées de Google Fonts comme dans globals.css) : Fraunces pour le titre,
// Manrope pour le reste. Satori n'accepte pas le woff2 : sans navigateur déclaré, Google
// renvoie du TrueType, réduit aux seuls caractères affichés (paramètre `text`).
// Si le chargement échoue, l'image sort avec la police par défaut plutôt que de planter.
async function police(famille: string, graisse: number, texte: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(
        `https://fonts.googleapis.com/css2?family=${famille}:wght@${graisse}&text=${encodeURIComponent(texte)}`,
      )
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(?:opentype|truetype)'\)/)?.[1];
    if (!url) return null;
    const reponse = await fetch(url);
    return reponse.ok ? await reponse.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const [sax, fraunces, manrope] = await Promise.all([
    readFile(join(process.cwd(), "public/sax.png")),
    police("Fraunces", 600, TITRE),
    police("Manrope", 500, SURTITRE.toUpperCase() + TEXTE), // surtitre affiché en capitales
  ]);
  const saxSrc = `data:image/png;base64,${sax.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 56,
          padding: "0 90px",
          background: "linear-gradient(180deg, #f9f5ee 0%, #f6f1e8 58%, #f2ece2 100%)",
          color: "#1c1917",
          fontFamily: manrope ? "Manrope" : undefined,
        }}
      >
        <img src={saxSrc} alt="" width={300} height={300} />
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 640 }}>
          <div style={{ fontSize: 24, letterSpacing: 6, textTransform: "uppercase", color: "#78716c" }}>
            {SURTITRE}
          </div>
          <div style={{ fontSize: 96, fontFamily: fraunces ? "Fraunces" : undefined, fontWeight: 600, lineHeight: 1 }}>
            {TITRE}
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.35, color: "#57534e" }}>
            {TEXTE}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        ...(fraunces ? [{ name: "Fraunces", data: fraunces, weight: 600 as const, style: "normal" as const }] : []),
        ...(manrope ? [{ name: "Manrope", data: manrope, weight: 500 as const, style: "normal" as const }] : []),
      ],
    },
  );
}
