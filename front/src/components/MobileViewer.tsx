import { Document, Page } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../styles/MobileViewer.css";

import type { MobileViewerProps } from "../types/interface";

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
  insight,
  insightLoading,
  insightError,
  onGenerateInsight,
}: MobileViewerProps) {

  const pageWidth = pdfWidth * scale;

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

          <button
            type="button"
            onClick={onGenerateInsight}
            disabled={insightLoading}
            className="mt-2 px-2 py-1 text-xs rounded bg-amber-100 text-amber-900 disabled:opacity-60"
          >
            {insightLoading ? "Génération..." : "Générer les anecdotes IA"}
          </button>

          {insightLoading && (
            <p className="text-xs text-amber-700 mt-1">Génération des anecdotes IA...</p>
          )}

          {insightError && (
            <p className="text-xs text-red-600 mt-1">{insightError}</p>
          )}

          {!insightLoading && !insightError && insight && (
            <div className="mt-2 text-left text-xs text-slate-700">
              <p>
                <span className="font-semibold">Mot-clé:</span> {insight.composerWord}
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                {insight.anecdotes.map((anecdote, index) => (
                  <li key={`${index}-${anecdote}`}>{anecdote}</li>
                ))}
              </ul>
            </div>
          )}
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
