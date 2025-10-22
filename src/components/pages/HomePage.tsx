'use client';

import { Media } from '@/types/Media';
import React from 'react';
import { MediaGrid } from '../Medias/MediaGrid';
import { Layout } from '../utils/Layout';

export function HomePage(): React.JSX.Element {
  const [thumbs, setThumbs] = React.useState<Media[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchThumbs = async () => {
    const res = await fetch('/api/thumbs');
    const data = await res.json();
    setThumbs(data.thumbs);
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
          onClick={handleScan}
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
