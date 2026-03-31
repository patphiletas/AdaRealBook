import { useState, useEffect, useCallback } from 'react';
import { pdfjs } from 'react-pdf';
import SearchList from './components/SearchList';
import PdfViewer from './components/PdfViewer';
import MobileViewer from './components/MobileViewer';
import "./styles/PdfViewer.css";
import "./styles/MobileViewer.css";

import type { Partition, SongInsight } from './types/interface';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const CLOUDINARY_BASE = "https://res.cloudinary.com/dpnudoyxb/image/upload";
const MOBILE_BREAKPOINT = 860;

export default function App() {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Partition | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(600);
  const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

  const [insight, setInsight] = useState<SongInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/partitions`)
      .then(res => res.json())
      .then(data => setPartitions(data))
      .catch(err => console.error("Erreur :", err));
  }, []);

  const handleGenerateInsight = useCallback(async () => {
    if (!selected) return;

    setInsight(null);
    setInsightError(null);
    setInsightLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ai/song-insight`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selected.title,
          composer: selected.composer
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Erreur IA');
      }

      const data: SongInsight = await res.json();
      setInsight(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Impossible de charger les anecdotes';
      setInsightError(message);
    } finally {
      setInsightLoading(false);
    }
  }, [selected]);

  const handleOpenInsight = useCallback(() => {
    if (!selected) return;
    setInsightOpen(true);
    if (!insight && !insightLoading) {
      handleGenerateInsight();
    }
  }, [selected, insight, insightLoading, handleGenerateInsight]);

  const handleCloseInsight = () => setInsightOpen(false);

  const updateLayout = useCallback(() => {
    const w = window.innerWidth;
    setIsMobile(w < MOBILE_BREAKPOINT);
    setPdfWidth(w < MOBILE_BREAKPOINT ? w - 32 : Math.floor(w * 0.66 - 48));
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    setNumPages(0);
    setScale(1);
    setInsight(null);
    setInsightError(null);
    setInsightLoading(false);
    setInsightOpen(false);
  }, [selected]);

  const pdfUrl = selected ? `${CLOUDINARY_BASE}/${selected.name_pdf}.pdf` : null;

  const zoomIn = () => setScale(s => Math.min(3, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const zoomReset = () => setScale(1);

  if (isMobile && selected) {
    return (
      <>
        <MobileViewer
          partition={selected}
          pdfUrl={pdfUrl!}
          numPages={numPages}
          scale={scale}
          pdfWidth={pdfWidth}
          onLoadSuccess={setNumPages}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          onBack={() => setSelected(null)}
          insightLoading={insightLoading}
          onOpenInsight={handleOpenInsight}
        />
        {insightOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6">
            <div className="w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-amber-200/50 bg-[linear-gradient(145deg,#fffdf7_0%,#fff6ea_45%,#fbe9d7_100%)] shadow-2xl">
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-amber-300/40">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-amber-950">Fiche de {selected.composer}</h2>
                <button type="button" onClick={handleCloseInsight} className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200">
                  Fermer
                </button>
              </div>
              <div className="max-h-[74vh] overflow-y-auto px-4 sm:px-6 py-4">
                {insightLoading && (
                  <p className="text-sm text-amber-900">Génération des informations IA...</p>
                )}
                {insightError && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-700">{insightError}</p>
                    <button type="button" onClick={handleGenerateInsight} className="rounded-md bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300">
                      Réessayer
                    </button>
                  </div>
                )}
                {!insightLoading && !insightError && insight && (
                  <div className="space-y-4">
                    <p className="text-sm leading-6 text-stone-800">
                      <span className="font-semibold text-stone-950">Compositeur:</span> {insight.composerWord}
                    </p>
                    <p className="text-sm leading-6 text-stone-800">
                      <span className="font-semibold text-stone-950">Tonalité:</span> {insight.tonalite}
                    </p>
                    <div className="rounded-lg bg-white/80 border border-amber-100 px-3 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Grille</p>
                      <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-stone-800">
                        {insight.grille}
                      </pre>
                    </div>
                    <ul className="space-y-2">
                      {insight.anecdotes.map((anecdote, index) => (
                        <li key={`${index}-${anecdote}`} className="rounded-lg bg-white/70 border border-amber-100 px-3 py-2 text-sm leading-6 text-stone-800">
                          {anecdote}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[linear-gradient(180deg,#f9f5ee_0%,#f6f1e8_58%,#f2ece2_100%)] overflow-hidden">

      <header className="relative shrink-0 overflow-hidden border-b border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,255,252,0.98)_0%,rgba(247,243,237,0.96)_100%)] px-6 py-4 shadow-sm backdrop-blur-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50"
          style={{
            backgroundImage: `
              radial-gradient(circle at 18% 10%, rgba(41, 37, 36, 0.05), transparent 26%),
              linear-gradient(to right, rgba(87, 83, 78, 0.06) 0px, rgba(87, 83, 78, 0.06) 1px, transparent 1px, transparent 22px)
            `,
            backgroundSize: '100% 100%, 22px 100%',
            backgroundPosition: 'center, 0 0',
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-10 top-0 h-20 w-32 rounded-full bg-stone-300/20 blur-3xl"
        />
        <div className="relative z-10 flex items-center justify-between gap-6">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center">
            <img
              src="/sax.png"
              alt=""
              aria-hidden="true"
              className="h-12 w-12 object-contain opacity-90"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
              Jazz Library
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-stone-900">
              Ada Real Book
            </h1>
            <p className="mt-1 text-sm text-stone-500">{partitions.length} morceaux · Volume 1</p>
          </div>
        </div>
        {selected && !isMobile && (
          <div className="max-w-sm rounded-2xl border border-stone-200/80 bg-white/75 px-4 py-2.5 shadow-[0_10px_30px_-20px_rgba(28,25,23,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-500">Morceau en cours</p>
                <p className="mt-0.5 truncate text-[13px] font-semibold text-stone-900">{selected.title}</p>
                <p className="truncate text-xs text-stone-600">
              {selected.composer} · <span className="font-mono">{selected.musical_key}</span> · <em>{selected.category}</em>
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenInsight}
                className="shrink-0 rounded-full border border-stone-300 bg-stone-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-stone-800"
              >
                Ouvrir la fiche
              </button>
            </div>
          </div>
        )}
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {isMobile ? (
          <SearchList
            partitions={partitions}
            search={search}
            onSearchChange={setSearch}
            selected={selected}
            onSelect={setSelected}
            fullWidth
          />
        ) : (
          <>
            <SearchList
              partitions={partitions}
              search={search}
              onSearchChange={setSearch}
              selected={selected}
              onSelect={setSelected}
            />
            <PdfViewer
              pdfUrl={pdfUrl}
              numPages={numPages}
              scale={scale}
              pdfWidth={pdfWidth}
              onLoadSuccess={setNumPages}
              onZoomIn={zoomIn}
              onZoomOut={zoomOut}
              onZoomReset={zoomReset}
            />
          </>
        )}
      </div>
      {selected && insightOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="w-full max-w-2xl rounded-2xl border border-amber-200/50 bg-[linear-gradient(145deg,#fffdf7_0%,#fff6ea_45%,#fbe9d7_100%)] shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-300/40">
              <h2 className="text-lg font-bold tracking-tight text-amber-950">Fiche de {selected.composer}</h2>
              
              <button type="button" onClick={handleCloseInsight} className="rounded-full px-3 py-1 text-xs font-semibold bg-amber-100 text-amber-900 hover:bg-amber-200">
                Fermer
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
              {insightLoading && (
                <p className="text-sm text-amber-900">Génération des informations IA...</p>
              )}
              {insightError && (
                <div className="space-y-2">
                  <p className="text-sm text-red-700">{insightError}</p>
                  <button type="button" onClick={handleGenerateInsight} className="rounded-md bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300">
                    Réessayer
                  </button>
                </div>
              )}
              {!insightLoading && !insightError && insight && (
                <div className="space-y-4">
                  <p className="text-sm leading-6 text-stone-800">
                    <span className="font-semibold text-stone-950">Compositeur:</span> {insight.composerWord}
                  </p>
                  <p className="text-sm leading-6 text-stone-800">
                    <span className="font-semibold text-stone-950">Tonalité:</span> {insight.tonalite}
                  </p>
                  <div className="rounded-lg bg-white/80 border border-amber-100 px-3 py-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-600">Grille</p>
                    <pre className="mt-1 whitespace-pre-wrap break-words font-mono text-xs leading-5 text-stone-800">
                      {insight.grille}
                    </pre>
                  </div>
                  <ul className="space-y-2">
                    {insight.anecdotes.map((anecdote, index) => (
                      <li key={`${index}-${anecdote}`} className="rounded-lg bg-white/70 border border-amber-100 px-3 py-2 text-sm leading-6 text-stone-800">
                        {anecdote}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
