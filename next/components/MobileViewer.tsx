"use client";

import "@/lib/pdfWorker";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/styles/MobileViewer.css";

import type { MobileViewerProps } from "@/types/interface";
import EditMetadataDialog from "./EditMetadataDialog";

export default function MobileViewer({
  partition,
  pdfUrl,
  numPages,
  scale,
  pdfWidth,
  onLoadSuccess,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onBack,
  insightLoading,
  onOpenInsight,
  onPartitionUpdated,
}: MobileViewerProps) {

  const pageWidth = pdfWidth * scale;
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `${partition.title}.pdf`;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrint = () => {
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

  return (
    <div className="mobileviewer-container">

      <div className="mobileviewer-header">
        <button onClick={onBack} className="mobileviewer-back">
          ← Retour
        </button>

        <div className="mobileviewer-title">
          <p className="mobileviewer-title-main">
            {partition.title}
          </p>
          <p className="mobileviewer-title-sub">
            {partition.composer} · {partition.musical_key}
          </p>

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onOpenInsight}
              className="mobileviewer-insight-button"
            >
              {insightLoading ? "Analyse IA en cours..." : "Ouvrir la fiche"}
            </button>
            <EditMetadataDialog partition={partition} onUpdated={onPartitionUpdated} />
          </div>
        </div>
      </div>

      <div className="mobileviewer-zoom">
        <button onClick={onZoomOut} className="mobileviewer-button">
          −
        </button>

        <span className="mobileviewer-scale">
          {Math.round(scale * 100)}%
        </span>

        <button onClick={onZoomIn} className="mobileviewer-button">
          +
        </button>

        <button
          onClick={onZoomReset}
          className="mobileviewer-button mobileviewer-button-reset"
        >
          Reset
        </button>

        <button onClick={handleDownload} className="mobileviewer-button mobileviewer-button-action">
          Télécharger
        </button>

        <button onClick={handlePrint} className="mobileviewer-button mobileviewer-button-action">
          Imprimer
        </button>
      </div>

      <div className="mobileviewer-pdf-wrapper">
        <div
          className="mobileviewer-pdf-inner"
          style={{ width: pageWidth }}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={({ numPages }) => onLoadSuccess(numPages)}
            loading={<div className="mobileviewer-loading">Chargement...</div>}
            error={<div className="mobileviewer-error">Erreur de chargement</div>}
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
