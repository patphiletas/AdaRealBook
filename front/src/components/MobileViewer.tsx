// @ts-ignore
import { Document, Page } from 'react-pdf';

interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  name_pdf: string;
  category: string;
}

interface Props {
  partition: Partition;
  pdfUrl: string;
  numPages: number;
  scale: number;
  pdfWidth: number;
  onLoadSuccess: (numPages: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onBack: () => void;
}

export default function MobileViewer({
  partition, pdfUrl, numPages, scale, pdfWidth,
  onLoadSuccess, onZoomIn, onZoomOut, onZoomReset, onBack
}: Props) {
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Header mobile */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 shrink-0">
        <button
          onClick={onBack}
          className="text-white px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-sm font-medium"
        >
          ← Retour
        </button>
        <div className="min-w-0">
          <p className="text-white font-semibold truncate text-sm">{partition.title}</p>
          <p className="text-gray-400 text-xs truncate">{partition.composer} · {partition.musical_key}</p>
        </div>
      </div>

      {/* Zoom mobile */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <button onClick={onZoomOut} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">−</button>
        <span className="text-gray-400 text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">+</button>
        <button onClick={onZoomReset} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 text-sm transition-colors">Reset</button>
      </div>

      {/* PDF */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-900 p-2">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }: { numPages: number }) => onLoadSuccess(numPages)}
          loading={<div className="text-gray-400 mt-10 text-sm">Chargement...</div>}
          error={<div className="text-red-400 mt-10 text-sm">Erreur de chargement</div>}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pdfWidth}
              scale={scale}
              className="mb-2"
            />
          ))}
        </Document>
      </div>
    </div>
  );
}
