import type { Props } from "../types/interface";

export default function SearchList({ partitions, search, onSearchChange, selected, onSelect, fullWidth = false }: Props) {
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
    <div className={`flex flex-col border-r border-slate-200 bg-white overflow-hidden ${fullWidth ? 'w-full' : 'w-1/3 shrink-0'}`}>
      <div className="p-3 border-b border-slate-100 shrink-0">
        <input
          type="text"
          placeholder="Titre, compositeur... ou (Bb)"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all bg-slate-50"
        />
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-slate-50">
        {resultats.length === 0 ? (
          <li className="p-6 text-center text-slate-400 italic text-sm">
            Aucun morceau pour "{search}"
          </li>
        ) : (
          resultats.map(item => (
            <li
              key={item.id}
              onClick={() => onSelect(item)}
              className={`px-4 py-3 cursor-pointer transition-colors border-l-2
                ${selected?.id === item.id
                  ? 'bg-red-50 border-red-500'
                  : 'hover:bg-slate-50 border-transparent'
                }`}
            >
              <p className={`font-medium text-sm leading-tight ${selected?.id === item.id ? 'text-red-700' : 'text-slate-900'}`}>
                {item.title}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {item.composer} · <span className="font-mono">{item.musical_key}</span>
              </p>
            </li>
          ))
        )}
      </ul>

      <div className="shrink-0 px-4 py-2 border-t border-slate-100 text-xs text-slate-400">
        {resultats.length} résultat{resultats.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
