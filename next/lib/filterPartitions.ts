import type { Partition } from "@/types/interface";

// Filtre texte (titre, compositeur, catégorie, ou « (Bb) » pour une tonalité)
// et, en option, une tonalité choisie par pastille.
export function filterPartitions(
  partitions: Partition[],
  search: string,
  { tonalite = "" }: { tonalite?: string } = {}
): Partition[] {
  const saisie = search.trim().toLowerCase();
  const tonChoisi = tonalite.trim().toLowerCase();

  return partitions.filter((p) => {
    if (tonChoisi && p.musical_key?.toLowerCase() !== tonChoisi) return false;
    if (!saisie) return true;
    if (saisie.startsWith("(") && saisie.endsWith(")")) {
      const ton = saisie.replace(/[()]/g, "");
      return p.musical_key?.toLowerCase() === ton;
    }
    if (saisie.length < 3) return true;
    return (
      p.title?.toLowerCase().includes(saisie) ||
      p.composer?.toLowerCase().includes(saisie) ||
      p.category?.toLowerCase().includes(saisie) ||
      false
    );
  });
}

// Base de la liste selon l'onglet : tous, favoris (ordre alphabétique de la
// bibliothèque) ou récents (du plus récent au plus ancien).
export function listeSelonVue(
  partitions: Partition[],
  vue: "tous" | "favoris" | "recents",
  favoris: number[],
  recents: number[]
): Partition[] {
  if (vue === "favoris") {
    const ids = new Set(favoris);
    return partitions.filter((p) => ids.has(p.id));
  }
  if (vue === "recents") {
    const parId = new Map(partitions.map((p) => [p.id, p]));
    return recents.map((id) => parId.get(id)).filter((p): p is Partition => Boolean(p));
  }
  return partitions;
}
