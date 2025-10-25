import type { Album } from './Album';
import type { Media } from './Media';

export type ErrorResponse = { error: string; [k: string]: unknown };

export type AlbumsResponse = { albums: Album[] } | ErrorResponse;

export type AlbumMediasResponse =
  | {
      medias: Media[];
      total: number;
      hasMore: boolean;
      offset: number;
      limit: number;
      albumPath: string;
    }
  | ErrorResponse;

export type ThumbsItem = {
  file: string;
  fileId: string;
  thumb: string;
  type: string;
  duration: string | null;
  thumbReady: boolean;
  createdAt: string;
};

export type ThumbsResponse =
  | {
      thumbs: ThumbsItem[];
      total: number;
      hasMore: boolean;
      offset: number;
      limit: number;
    }
  | ErrorResponse;
