'use client';

import { Media } from '@/types/Media';
import React from 'react';
import { MediaGrid } from '../Medias/MediaGrid';
import { Layout } from '../utils/Layout';

export function HomePage(): React.JSX.Element {
  const [thumbs, setThumbs] = React.useState<Media[]>([]);
  const [loading, setLoading] = React.useState(false);

  type ThumbsResponse = { thumbs: Media[] };
  const isThumbsResponse = (val: unknown): val is ThumbsResponse => {
    if (!val || typeof val !== 'object') return false;
    const v = val as { thumbs?: unknown };
    return Array.isArray(v.thumbs);
  };

  const fetchThumbs = async (): Promise<void> => {
    const res = await fetch('/api/thumbs');
    const json: unknown = await res.json();
    if (isThumbsResponse(json)) {
      setThumbs(json.thumbs);
    } else {
      setThumbs([]);
    }
  };

  React.useEffect(() => {
    fetchThumbs();
  }, []);

  const handleScan = async () => {
    setLoading(true);
    await fetch('/api/scan', { method: 'POST' });
    await fetchThumbs();
    setLoading(false);
  };

  return (
    <Layout className="md:px-10">
      <div className="flex flex-col items-center justify-center mt-30">
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded shadow hover:bg-blue-600"
          onClick={() => {
            void handleScan();
          }}
          disabled={loading}
        >
          {loading ? 'Scan en cours...' : 'Scanner les nouveaux médias'}
        </button>
      </div>
      <div className="mt-8">
        <MediaGrid medias={thumbs} />
      </div>
    </Layout>
  );
}
