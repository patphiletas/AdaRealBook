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

export interface SearchListProps {
  partitions: Partition[];
  search: string;
  onSearchChange: (value: string) => void;
  selected: Partition | null;
  onSelect: (partition: Partition) => void;
  fullWidth?: boolean;
}

export interface PdfViewerProps {
  pdfUrl: string | null;
  numPages: number;
  scale: number;
  pdfWidth: number;
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
}
