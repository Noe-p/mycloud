export interface Media {
  file: string;
  thumb: string;
  type: 'image' | 'video';
  duration?: string | null;
}
