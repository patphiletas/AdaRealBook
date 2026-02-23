export interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  name_pdf: string;
  category: string;
}
  

 export interface Props {
  partition: Partition[];
  pdfUrl: string;
  numPages: number;
  scale: number;
  pdfWidth: number;
  search: string;
  onSearchChange: (value: string) => void;
  selected: Partition | null;
  onSelect: (partition: Partition) => void;
  fullWidth?: boolean;
  onLoadSuccess: (numPages: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onBack: () => void;
}