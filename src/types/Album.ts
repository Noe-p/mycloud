export interface Album {
  id: string;
  name: string;
  relativePath: string;
  mediaCount: number;
  subAlbums: Album[];
  coverThumb?: string | undefined;
  hasMedia: boolean;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}
