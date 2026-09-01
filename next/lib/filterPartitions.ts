import type { Partition } from "@/types/interface";

export function filterPartitions(partitions: Partition[], search: string): Partition[] {
  const saisie = search.trim().toLowerCase();

  return partitions.filter((p) => {
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
