export interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  name_pdf: string;
  category: string;
}

export interface SongInsight {
  composerWord: string;
  tonalite: string;
  grille: string;
  anecdotes: string[];
}

export type EtatListe = "chargement" | "prete" | "erreur";
export type VueListe = "tous" | "favoris" | "recents";

export interface SearchListProps {
  partitions: Partition[];
  etat?: EtatListe;
  onReessayer?: () => void;
  vue?: VueListe;
  onVueChange?: (vue: VueListe) => void;
  tonalites?: string[];
  tonalite?: string;
  onTonaliteChange?: (tonalite: string) => void;
  favoris?: number[];
  nbFavoris?: number;
  nbRecents?: number;
  search: string;
  onSearchChange: (value: string) => void;
  selected: Partition | null;
  onSelect: (partition: Partition) => void;
  fullWidth?: boolean;
}

export interface PdfViewerProps {
  pdfUrl: string | null;
  partitionTitle?: string;
  numPages: number;
  scale: number;
  pdfWidth?: number;
  onLoadSuccess: (numPages: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export interface MobileViewerProps {
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
  insightLoading: boolean;
  onOpenInsight: () => void;
  onPartitionUpdated: (updated: Partition) => void;
  estFavori: boolean;
  onBasculerFavori: () => void;
  theme: string;
  onBasculerTheme: () => void;
}
