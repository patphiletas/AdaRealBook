import type { Partition } from "@/types/interface";

// Adresse d'un morceau : ?morceau=a-night-in-tunisia-42
// Le titre rend le lien lisible ; l'identifiant final le rend unique et stable
// (un titre peut changer via l'édition des métadonnées, l'id jamais).

export function slugTitre(titre: string): string {
  return (
    titre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "") || "morceau"
  );
}

export function slugMorceau(p: Pick<Partition, "id" | "title">): string {
  return `${slugTitre(p.title ?? "")}-${p.id}`;
}

export function idDepuisSlug(slug: string | null | undefined): number | null {
  const m = /(?:^|-)(\d{1,9})$/.exec(slug ?? "");
  return m ? Number(m[1]) : null;
}

export function morceauDepuisUrl(search: string, partitions: Partition[]): Partition | null {
  const id = idDepuisSlug(new URLSearchParams(search).get("morceau"));
  if (id === null) return null;
  return partitions.find((p) => p.id === id) ?? null;
}
