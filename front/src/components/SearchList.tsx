import type { SearchListProps } from "../types/interface";

export default function SearchList({ partitions, search, onSearchChange, selected, onSelect, fullWidth = false }: SearchListProps) {
  const resultats = partitions.filter(p => {
    const saisie = search.trim().toLowerCase();
    if (!saisie) return true;
    if (saisie.startsWith("(") && saisie.endsWith(")")) {
      const ton = saisie.replace(/[()]/g, "");
      return p.musical_key?.toLowerCase() === ton;
    }
    if (saisie.length < 3) return true;
    return (
      p.title.toLowerCase().includes(saisie) ||
      p.composer.toLowerCase().includes(saisie) ||
      p.category.toLowerCase().includes(saisie)
    );
  });

  return (
    <div className={`flex flex-col border-r border-amber-100 bg-white/80 backdrop-blur-sm overflow-hidden ${fullWidth ? 'w-full' : 'w-1/3 shrink-0'}`}>
      <div className="p-3 border-b border-amber-100 shrink-0">
        <input
          type="text"
          placeholder="Titre, compositeur... ou (Bb)"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all bg-amber-50/40 text-stone-800 placeholder:text-stone-400"
        />
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-amber-50">
        {resultats.length === 0 ? (
          <li className="p-6 text-center text-stone-400 italic text-sm">
            Aucun morceau pour "{search}"
          </li>
        ) : (
          resultats.map(item => (
            <li
              key={item.id}
              onClick={() => onSelect(item)}
              className={`px-4 py-3 cursor-pointer transition-colors border-l-2
                ${selected?.id === item.id
                  ? 'bg-amber-50 border-amber-500'
                  : 'hover:bg-amber-50/50 border-transparent'
                }`}
            >
              <p className={`font-medium text-sm leading-tight ${selected?.id === item.id ? 'text-amber-900' : 'text-stone-900'}`}>
                {item.title}
              </p>
              <p className="text-xs text-stone-500 mt-0.5">
                {item.composer} · <span className="font-mono">{item.musical_key}</span>
              </p>
            </li>
          ))
        )}
      </ul>

      <div className="shrink-0 px-4 py-2 border-t border-amber-100 text-xs text-stone-500">
        {resultats.length} résultat{resultats.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
