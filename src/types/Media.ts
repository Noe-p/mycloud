export interface Media {
  file: string;
  fileId?: string; // ID unique pour identifier le fichier
  thumb: string;
  type: 'image' | 'video';
  duration?: string | null;
  thumbReady?: boolean;
  createdAt: string; // ISO date string
}
