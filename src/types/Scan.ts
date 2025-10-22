export type ScanResponse = {
  scanned: number;
  total?: number;
  imagesCount?: number;
  videosCount?: number;
  deletedThumbs?: number;
};

export type ScanState = {
  isScanning: boolean;
  progress: number;
  scanned: number;
  total: number;
  imagesCount: number;
  videosCount: number;
  deletedThumbs: number;
  startedAt?: string;
  completedAt?: string;
};
