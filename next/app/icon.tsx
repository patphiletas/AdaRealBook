import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Icône d'onglet : le saxophone de l'en-tête (public/sax.png) sur le fond crème du site.
// Remplace le favicon.ico par défaut de Next.js (triangle noir).
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const sax = await readFile(join(process.cwd(), "public/sax.png"));
  const saxSrc = `data:image/png;base64,${sax.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f1e8",
          borderRadius: 14,
        }}
      >
        <img src={saxSrc} alt="" width={60} height={60} />
      </div>
    ),
    size,
  );
}
