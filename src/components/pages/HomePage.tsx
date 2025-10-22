'use client';

import { useScan } from '@/hooks/useScan';
import { Media } from '@/types/Media';
import React from 'react';
import { MediaGrid } from '../Medias/MediaGrid';
import { Layout } from '../utils/Layout';

export function HomePage(): React.JSX.Element {
  const [thumbs, setThumbs] = React.useState<Media[]>([]);
  const { fetchThumbs } = useScan();

  React.useEffect(() => {
    void fetchThumbs().then(setThumbs);
  }, []);

  return (
    <Layout className="md:px-10">
      <div className="mt-22">
        <MediaGrid medias={thumbs} />
      </div>
    </Layout>
  );
}
