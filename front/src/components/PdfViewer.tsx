
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../styles/PdfViewer.css";
import type { PdfViewerProps } from "../types/interface.ts";

// interface PdfViewerProps {
//   pdfUrl: string | null;
//   numPages: number;
//   scale: number;
//   pdfWidth: number;
//   onLoadSuccess: (numPages: number) => void;
//   onZoomIn: () => void;
//   onZoomOut: () => void;
//   onZoomReset: () => void;
// }

export default function PdfViewer({
  pdfUrl,
  numPages,
  scale,
  pdfWidth,
  onLoadSuccess,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: PdfViewerProps) {

  if (!pdfUrl) {
    return (
      <div className="pdfviewer-empty">
        <span className="pdfviewer-empty-icon">🎼</span>
        <p className="pdfviewer-empty-text">Sélectionne un morceau</p>
      </div>
    );
  }

  return (
    <div className="pdfviewer-container">

      <div className="pdfviewer-toolbar">
        <button onClick={onZoomOut} className="pdfviewer-button">
          −
        </button>

        <span className="pdfviewer-scale">
          {Math.round(scale * 100)}%
        </span>

        <button onClick={onZoomIn} className="pdfviewer-button">
          +
        </button>

        <button
          onClick={onZoomReset}
          className="pdfviewer-button pdfviewer-button-reset"
        >
          Reset
        </button>
      </div>

      <div className="pdfviewer-scroll">
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
          loading={
            <p className="pdfviewer-loading">
              Chargement de la partition...
            </p>
          }
          error={
            <p className="pdfviewer-error">
              Impossible de charger le PDF.
            </p>
          }
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={pdfWidth * scale}
              className="shadow-lg mb-3 rounded overflow-hidden"
            />
          ))}
        </Document>
      </div>

    </div>
  );
}