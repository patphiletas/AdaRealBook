 export interface Partition {
  id: number;
  title: string;
  composer: string;
  musical_key: string;
  name_pdf: string;
  category: string;
}

 export interface Props {
  partitions: Partition[];
  search: string;
  onSearchChange: (value: string) => void;
  selected: Partition | null;
  onSelect: (partition: Partition) => void;
  fullWidth?: boolean;
}