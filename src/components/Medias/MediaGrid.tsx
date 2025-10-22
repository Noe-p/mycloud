import { Grid10 } from '@/static/styles/Grid';
import { Media } from '@/types/Media';

interface MediaGridProps {
  medias: Media[];
}

export function MediaGrid({ medias }: MediaGridProps): React.JSX.Element {
  return (
    <Grid10>
      {medias.map(({ file, thumb, type, duration }) => (
        <div
          key={file}
          className="aspect-square bg-gray-100 overflow-hidden flex items-center justify-center relative"
        >
          <img src={thumb} alt={file} className="object-cover w-full h-full" />
          {type === 'video' && duration && (
            <div className="absolute bottom-1 right-1 bg-black bg-opacity-30  backdrop-blur text-white text-xs px-1 py-0.5 rounded">
              {duration}
            </div>
          )}
        </div>
      ))}
    </Grid10>
  );
}
