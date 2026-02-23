import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { pdfjs } from 'react-pdf';
import SearchList from './components/SearchList';
import PdfViewer from './components/PdfViewer';
import MobileViewer from './components/MobileViewer';
import "./styles/PdfViewer.css";
import "./styles/MobileViewer.css";

import type { Partition } from './types/interface';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@5.4.296/build/pdf.worker.min.mjs`;

const CLOUDINARY_BASE = "https://res.cloudinary.com/dpnudoyxb/image/upload";

// const CLOUD_NAME = "dpnudoyxb";

// const buildPdfUrl = (publicId: string) =>
//   `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${publicId}.pdf`;

export default function App() {
  const [partitions, setPartitions] = useState<Partition[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Partition | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1);
  const [pdfWidth, setPdfWidth] = useState(600);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/partitions`)
      .then(res => res.json())
      .then(data => setPartitions(data))
      .catch(err => console.error("Erreur :", err));
  }, []);

  const updateLayout = useCallback(() => {
    const w = window.innerWidth;
    setIsMobile(w < 1024);
    setPdfWidth(w < 1024 ? w - 32 : Math.floor(w * 0.66 - 48));
  }, []);

  useEffect(() => {
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, [updateLayout]);

  useEffect(() => {
    setNumPages(0);
    setScale(1);
  }, [selected]);

  const pdfUrl = selected ? `${CLOUDINARY_BASE}/${selected.name_pdf}.pdf` : null;

  const zoomIn = () => setScale(s => Math.min(3, s + 0.25));
  const zoomOut = () => setScale(s => Math.max(0.5, s - 0.25));
  const zoomReset = () => setScale(1);

  if (isMobile && selected) {
    return (
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
      />
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">

      <header className="shrink-0 px-6 py-3 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            My Real Book <span className="text-red-500">🎷</span>
          </h1>
          <p className="text-slate-400 text-xs">{partitions.length} morceaux · Volume 1</p>
        </div>
        {selected && !isMobile && (
          <div className="text-right">
            <p className="font-semibold text-slate-800 text-sm">{selected.title}</p>
            <p className="text-slate-500 text-xs">
              {selected.composer} · <span className="font-mono">{selected.musical_key}</span> · <em>{selected.category}</em>
            </p>
          </div>
        )}
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

    </div>
  );
}
