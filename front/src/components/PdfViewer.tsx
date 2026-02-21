// @ts-ignore
import { Document, Page } from 'react-pdf';

interface Props {
  pdfUrl: string | null;
  numPages: number;
  scale: number;
  onLoadSuccess: (numPages: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export default function PdfViewer({ pdfUrl, numPages, scale, onLoadSuccess, onZoomIn, onZoomOut, onZoomReset }: Props) {
  if (!pdfUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3 select-none">
        <span className="text-6xl">🎼</span>
        <p className="text-sm">Sélectionne un morceau</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Barre de zoom */}
      <div className="flex items-center gap-2 py-2 px-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <button
          onClick={onZoomOut}
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium transition-colors"
        >−</button>
        <span className="text-sm text-slate-500 w-12 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={onZoomIn}
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm font-medium transition-colors"
        >+</button>
        <button
          onClick={onZoomReset}
          className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-sm text-slate-400 transition-colors"
        >Reset</button>
      </div>

      {/* PDF */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-4 px-2 gap-2 bg-gray-100">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }: { numPages: number }) => onLoadSuccess(numPages)}
          loading={
            <div className="mt-20 text-slate-500 text-sm animate-pulse">
              Chargement de la partition...
            </div>
          }
          error={
            <div className="mt-20 text-red-500 text-sm">
              Impossible de charger le PDF.
            </div>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              scale={scale}
              className="shadow-lg mb-3 rounded overflow-hidden"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
