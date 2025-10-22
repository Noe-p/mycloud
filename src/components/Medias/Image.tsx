import { cn } from '@/services/utils';
import NextImage from 'next/image';
import React, { useState } from 'react';

interface ImageProps
  extends Omit<React.ComponentProps<typeof NextImage>, 'alt'> {
  alt: string; // Rendre alt obligatoire pour l'accessibilité
  fallbackSrc?: string; // Image de fallback en cas d'erreur
  showLoadingIndicator?: boolean; // Afficher un indicateur de chargement
}

export function Image(props: ImageProps): React.JSX.Element {
  const {
    className,
    fallbackSrc,
    showLoadingIndicator = false,
    onError,
    src,
    ...imageProps
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
    } else {
      setHasError(true);
    }
    onError?.(e);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div
        className={cn(
          'w-full h-full bg-gray-200 flex items-center justify-center rounded-lg',
          className
        )}
      >
        <span className='text-gray-500 text-sm'>{'Image non disponible'}</span>
      </div>
    );
  }

  return (
    <div className='relative'>
      <NextImage
        src={currentSrc}
        className={cn(
          'w-full h-full object-cover object-center rounded-lg',
          isLoading && 'blur-sm scale-105',
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        {...imageProps}
      />
      {showLoadingIndicator && isLoading && (
        <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
          <div className='w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin' />
        </div>
      )}
    </div>
  );
}
