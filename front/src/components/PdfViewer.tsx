// @ts-ignore — react-pdf n'a pas de types parfaits, on ignore les warnings TS
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { PdfViewerProps } from '../types/interface';
import type { Partition } from '../types/interface';
// Props reçues depuis App.tsx


export default function PdfViewer({ pdfUrl, numPages, scale, pdfWidth, onLoadSuccess, onZoomIn, onZoomOut, onZoomReset }: PdfViewerProps & { partition: Partition }) {

  // Aucun morceau sélectionné : état vide centré
  if (!pdfUrl) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <span style={{ fontSize: '4rem' }}>🎼</span>
        <p style={{ fontSize: '0.875rem', marginTop: '0.75rem' }}>Sélectionne un morceau</p>
      </div>
    );
  }

  return (
    // Conteneur principal : flex colonne, prend tout l'espace disponible (flex:1 hérité du parent dans App)
    // overflow:hidden indispensable — sans ça, le contenu PDF déborde et crée du scroll parasite
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Barre de zoom — hauteur fixe (flexShrink:0), ne participe pas au scroll */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        flexShrink: 0,                          // ne rétrécit jamais, hauteur toujours garantie
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        <button onClick={onZoomOut} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>−</button>
        {/* Affichage du zoom en % — scale * 100 arrondi à l'entier */}
        <span style={{ fontSize: '0.875rem', color: '#64748b', width: '3rem', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
        <button onClick={onZoomIn} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 500 }}>+</button>
        <button onClick={onZoomReset} style={{ padding: '0.25rem 0.75rem', borderRadius: '0.375rem', background: '#f1f5f9', border: 'none', cursor: 'pointer', fontSize: '0.875rem', color: '#94a3b8' }}>Reset</button>
      </div>

      {/* Zone scrollable — prend tout l'espace restant après la barre de zoom (flex:1)
          overflowY:auto = scroll vertical uniquement si le contenu dépasse
          overflowX:auto = scroll horizontal si on zoome beaucoup
          Le scroll s'arrête au bas du dernier Page rendu, pas au bas de l'écran */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '1rem 0.5rem',
        gap: '0.5rem',
        background: '#f3f4f6'
      }}>
        {/* Document = composant react-pdf qui gère le chargement du fichier PDF
            file = URL du PDF (Cloudinary)
            onLoadSuccess = appelé une fois le PDF parsé, retourne { numPages }
            On récupère numPages pour savoir combien de <Page> rendre */}
        <Document
          file={pdfUrl}
          onLoadSuccess={({ numPages }: { numPages: number }) => onLoadSuccess(numPages)}
          loading={<p style={{ marginTop: '5rem', color: '#64748b', fontSize: '0.875rem' }}>Chargement de la partition...</p>}
          error={<p style={{ marginTop: '5rem', color: '#ef4444', fontSize: '0.875rem' }}>Impossible de charger le PDF.</p>}
          className="flex flex-col items-center"
        >
          {/* On génère autant de <Page> que de pages dans le PDF
              width = pdfWidth * scale : on n'utilise PAS le prop scale de react-pdf
              pour éviter un double scaling (width ET scale appliqués en séquence = taille x2)
              On calcule directement la largeur finale : base * facteur de zoom */}
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
