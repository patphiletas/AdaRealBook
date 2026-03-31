
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
  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = "partition.pdf";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    if (!printWindow) return;
    printWindow.focus();
    window.setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Some browsers block programmatic print on PDF viewers.
      }
    }, 900);
  };

  if (!pdfUrl) {
    return (
      <div className="pdfviewer-empty">
        <div className="pdfviewer-empty-hero" aria-hidden="true">
          <img src="/sax.jpg" alt="" className="pdfviewer-empty-image" />
        </div>
        <div className="pdfviewer-empty-card">
          <p className="pdfviewer-empty-kicker">Jazz Library</p>
          <p className="pdfviewer-empty-text">Sélectionnez un morceau pour afficher la partition</p>
        </div>
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

        <div className="pdfviewer-toolbar-spacer" />

        <button onClick={handleDownload} className="pdfviewer-button pdfviewer-button-action">
          Télécharger PDF
        </button>
        <button onClick={handlePrint} className="pdfviewer-button pdfviewer-button-action">
          Imprimer
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
