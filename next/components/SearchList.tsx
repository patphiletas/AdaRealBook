import type { SearchListProps } from "@/types/interface";
import { filterPartitions } from "@/lib/filterPartitions";

export default function SearchList({
  partitions,
  etat = "prete",
  onReessayer,
  search,
  onSearchChange,
  selected,
  onSelect,
  fullWidth = false,
}: SearchListProps) {
  const resultats = filterPartitions(partitions, search);

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
            Aucun morceau pour « {search} »
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
