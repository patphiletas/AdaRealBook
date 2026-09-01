"use client";

import "@/lib/pdfWorker";
import { useRef, useEffect, useState } from "react";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "@/styles/PdfViewer.css";
import type { PdfViewerProps } from "@/types/interface";

export default function PdfViewer({
  pdfUrl,
  numPages,
  scale,
  onLoadSuccess,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: PdfViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [pageAspectRatio, setPageAspectRatio] = useState<number | null>(null);

  // Mesure le conteneur de scroll
  useEffect(() => {
    if (!scrollRef.current) return;
    const observer = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ width, height });
    });
    observer.observe(scrollRef.current);
    return () => observer.disconnect();
  }, []);

  // Réinitialise le ratio quand la partition change
  useEffect(() => {
    setPageAspectRatio(null);
  }, [pdfUrl]);

  // Largeur de base pour tenir la page entière (fit-to-view)
  // min(largeur dispo, hauteur dispo * ratio) avec un peu de marge
  const availableWidth = containerSize.width - 24;
  const availableHeight = containerSize.height - 24;
  const baseWidth =
    pageAspectRatio && availableWidth > 0 && availableHeight > 0
      ? Math.min(availableWidth, availableHeight * pageAspectRatio)
      : availableWidth > 0
      ? availableWidth
      : 600;

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

      <div className="pdfviewer-scroll" ref={scrollRef}>
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
              width={baseWidth * scale}
              onLoadSuccess={i === 0 ? (page) => {
                setPageAspectRatio(page.originalWidth / page.originalHeight);
              } : undefined}
              className="shadow-lg mb-3 rounded overflow-hidden"
            />
          ))}
        </Document>
      </div>

    </div>
  );
}
