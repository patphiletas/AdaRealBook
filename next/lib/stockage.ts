// Petit magasin autour de localStorage, lisible avec useSyncExternalStore
// (pas de setState dans un effet, pas d'écart d'hydratation).

const ecouteurs = new Set<() => void>();

export function abonnerStockage(rappel: () => void) {
  ecouteurs.add(rappel);
  window.addEventListener("storage", rappel); // autre onglet
  return () => {
    ecouteurs.delete(rappel);
    window.removeEventListener("storage", rappel);
  };
}

export function lireStockage(cle: string): string | null {
  try {
    return window.localStorage.getItem(cle);
  } catch {
    return null; // navigation privée stricte
  }
}

export function ecrireStockage(cle: string, valeur: string) {
  try {
    window.localStorage.setItem(cle, valeur);
  } catch {
    /* le choix ne sera pas retenu */
  }
  ecouteurs.forEach((f) => f());
}
