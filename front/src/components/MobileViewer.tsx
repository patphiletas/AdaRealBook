import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { MobileViewerProps, Partition } from '../types/interface.ts';




export default function MobileViewer({
  partition, pdfUrl, numPages, scale, pdfWidth,
  onLoadSuccess, onZoomIn, onZoomOut, onZoomReset, onBack
}: MobileViewerProps) {

  const pageWidth = pdfWidth * scale;

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">

      {/* Header */}
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

      {/* Zoom */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-b border-gray-700 shrink-0">
        <button onClick={onZoomOut} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">−</button>
        <span className="text-gray-400 text-sm w-12 text-center">{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium transition-colors">+</button>
        <button onClick={onZoomReset} className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-400 text-sm transition-colors">Reset</button>
      </div>

      {/* PDF — même structure que PdfViewer : wrapper à largeur fixe pour stopper le scroll parasite */}
      <div className="flex-1 overflow-auto bg-gray-900 p-2">
        <div style={{ width: pageWidth, margin: '0 auto' }}>
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
                width={pageWidth}
                className="mb-2"
              />
            ))}
          </Document>
        </div>
      </div>

    </div>
  );
}
