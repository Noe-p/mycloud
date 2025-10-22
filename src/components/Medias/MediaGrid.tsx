import { Grid10 } from '@/static/styles/Grid';
import { Media } from '@/types/Media';
import Image from 'next/image';
import { useState } from 'react';
import { ImagesFullScreen } from './ImagesFullScreen';

interface MediaGridProps {
  medias: Media[];
}

export function MediaGrid({ medias }: MediaGridProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

  const handleMediaClick = (index: number) => {
    setSelectedIndex(index);
    setIsFullScreenOpen(true);
  };

  const handleClose = () => {
    setIsFullScreenOpen(false);
    setSelectedIndex(null);
  };

  // Extraire les URLs complètes des médias pour le fullscreen
  const mediaUrls = medias.map((media) => `/api/media/${media.file}`);

  return (
    <>
      <Grid10>
        {medias.map(({ file, thumb, type, duration }, index) => (
          <div
            key={file}
            className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center relative rounded cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleMediaClick(index)}
          >
            <Image
              src={thumb}
              alt={file}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 6}
            />
            {type === 'video' && duration && (
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-30 backdrop-blur text-white text-xs px-1 py-0.5 rounded">
                {duration}
              </div>
            )}
          </div>
        ))}
      </Grid10>

      {selectedIndex !== null && (
        <ImagesFullScreen
          images={mediaUrls}
          medias={medias}
          isOpen={isFullScreenOpen}
          onClose={handleClose}
          initialIndex={selectedIndex}
        />
      )}
    </>
  );
}
