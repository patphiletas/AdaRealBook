import type { SearchListProps } from "@/types/interface";
import { filterPartitions } from "@/lib/filterPartitions";

const ONGLETS = [
  { valeur: "tous", libelle: "Tous" },
  { valeur: "favoris", libelle: "★ Favoris" },
  { valeur: "recents", libelle: "Récents" },
] as const;

export default function SearchList({
  partitions,
  etat = "prete",
  onReessayer,
  vue = "tous",
  onVueChange,
  tonalites = [],
  tonalite = "",
  onTonaliteChange,
  favoris = [],
  nbFavoris = 0,
  nbRecents = 0,
  search,
  onSearchChange,
  selected,
  onSelect,
  fullWidth = false,
}: SearchListProps) {
  const resultats = filterPartitions(partitions, search, { tonalite });
  const nombres = { tous: null, favoris: nbFavoris, recents: nbRecents };
  const pastille = (actif: boolean) =>
    `shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
      actif ? "border-amber-500 bg-amber-100 text-amber-900" : "border-stone-200 bg-white text-stone-600 hover:bg-stone-100"
    }`;

  return (
    <div className={`flex min-w-0 flex-col border-r border-amber-100 bg-white/80 backdrop-blur-sm overflow-hidden ${fullWidth ? "w-full" : "w-1/3 shrink-0"}`}>
      <div className="p-3 border-b border-amber-100 shrink-0">
        <label htmlFor="recherche" className="sr-only">
          Rechercher un morceau
        </label>
        <input
          id="recherche"
          type="search"
          placeholder="Titre, compositeur... ou (Bb)"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="block w-full min-w-0 px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-amber-50/40 text-stone-800 placeholder:text-stone-400"
        />

        {onVueChange && (
          <div className="mt-2 flex gap-1.5" role="group" aria-label="Afficher">
            {ONGLETS.map(({ valeur, libelle }) => (
              <button
                key={valeur}
                type="button"
                aria-pressed={vue === valeur}
                onClick={() => onVueChange(valeur)}
                className={pastille(vue === valeur)}
              >
                {libelle}
                {nombres[valeur] !== null && <span className="ml-1 text-stone-400">{nombres[valeur]}</span>}
              </button>
            ))}
          </div>
        )}

        {onTonaliteChange && tonalites.length > 0 && (
          // Deux lignes de pastilles, lues de gauche à droite (les plus fréquentes
          // en haut) ; la rangée défile horizontalement si elle déborde.
          <div
            className="mt-2 -mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none]"
            role="group"
            aria-label="Filtrer par tonalité"
          >
            <div className="inline-flex flex-col gap-1.5">
              {[
                ["", ...tonalites.slice(0, Math.ceil((tonalites.length + 1) / 2) - 1)],
                tonalites.slice(Math.ceil((tonalites.length + 1) / 2) - 1),
              ].map((rangee, i) => (
                <div key={i} className="flex gap-1.5">
                  {rangee.map((ton) =>
                    ton === "" ? (
                      <button key="toutes" type="button" aria-pressed={!tonalite} onClick={() => onTonaliteChange("")} className={pastille(!tonalite)}>
                        Toutes tonalités
                      </button>
                    ) : (
                      <button
                        key={ton}
                        type="button"
                        aria-pressed={tonalite === ton}
                        onClick={() => onTonaliteChange(tonalite === ton ? "" : ton)}
                        className={`${pastille(tonalite === ton)} min-w-[2.75rem] justify-center text-center font-mono`}
                      >
                        {ton}
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-amber-50" aria-busy={etat === "chargement"}>
        {etat === "chargement" ? (
          <li className="p-6 text-center text-stone-500 text-sm" role="status">
            Chargement des morceaux…
          </li>
        ) : etat === "erreur" ? (
          <li className="p-6 text-center text-sm space-y-3" role="alert">
            <p className="text-red-700">Impossible de charger les morceaux. Vérifiez votre connexion.</p>
            {onReessayer && (
              <button
                type="button"
                onClick={onReessayer}
                className="rounded-md bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300"
              >
                Réessayer
              </button>
            )}
          </li>
        ) : resultats.length === 0 ? (
          <li className="p-6 text-center text-stone-400 italic text-sm">
            {vue === "favoris" && partitions.length === 0
              ? "Aucun favori pour l'instant : ouvrez un morceau et touchez ☆."
              : vue === "recents" && partitions.length === 0
                ? "Aucun morceau consulté pour l'instant."
                : search
                  ? `Aucun morceau pour « ${search} »${tonalite ? ` en ${tonalite}` : ""}`
                  : `Aucun morceau en ${tonalite}`}
          </li>
        ) : (
          resultats.map(item => {
            const actif = selected?.id === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  aria-current={actif ? "true" : undefined}
                  className={`block w-full text-left px-4 py-3 cursor-pointer transition-colors border-l-2 focus:outline-none focus-visible:bg-amber-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-400
                    ${actif ? "bg-amber-50 border-amber-500" : "hover:bg-amber-50/50 border-transparent"}`}
                >
                  <span className={`block font-medium text-sm leading-tight ${actif ? "text-amber-900" : "text-stone-900"}`}>
                    {item.title}
                    {favoris.includes(item.id) && (
                      <span className="ml-1.5 text-amber-600" aria-label="favori">★</span>
                    )}
                  </span>
                  <span className="block text-xs text-stone-500 mt-0.5">
                    {item.composer} · <span className="font-mono">{item.musical_key}</span>
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>

      <div className="shrink-0 px-4 py-2 border-t border-amber-100 text-xs text-stone-500" aria-live="polite">
        {etat === "prete" ? `${resultats.length} résultat${resultats.length !== 1 ? "s" : ""}` : " "}
      </div>
    </div>
  );
}
