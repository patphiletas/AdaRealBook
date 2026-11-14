// Favoris et morceaux récents, gardés dans le navigateur (localStorage) :
// pas de compte ni de table en base, l'app reste un outil personnel.
// Fonctions pures ici ; la lecture/écriture de localStorage est dans app/page.tsx.

export const CLE_FAVORIS = "realbook:favoris";
export const CLE_RECENTS = "realbook:recents";
export const MAX_RECENTS = 12;

// Relit une liste d'identifiants stockée en JSON ; toute valeur abîmée donne [].
export function lireIds(brut: string | null): number[] {
  if (!brut) return [];
  try {
    const valeur: unknown = JSON.parse(brut);
    if (!Array.isArray(valeur)) return [];
    return [...new Set(valeur.filter((v): v is number => Number.isInteger(v) && v > 0))];
  } catch {
    return [];
  }
}

export function basculerFavori(favoris: number[], id: number): number[] {
  return favoris.includes(id) ? favoris.filter((f) => f !== id) : [id, ...favoris];
}

// Le plus récent en tête, sans doublon, limité à MAX_RECENTS.
export function ajouterRecent(recents: number[], id: number, max = MAX_RECENTS): number[] {
  return [id, ...recents.filter((r) => r !== id)].slice(0, max);
}

// Tonalités présentes dans la bibliothèque, de la plus fréquente à la plus rare.
export function tonalitesDisponibles(partitions: { musical_key: string | null }[]): string[] {
  const compte = new Map<string, number>();
  for (const p of partitions) {
    const ton = p.musical_key?.trim();
    if (ton) compte.set(ton, (compte.get(ton) ?? 0) + 1);
  }
  return [...compte.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([ton]) => ton);
}
