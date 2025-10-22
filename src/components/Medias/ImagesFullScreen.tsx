'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useUmami } from '@/hooks/useUmami';
import { cn } from '@/services/utils';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface ImagesFullScreenProps {
  images: string[];
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  projectName?: string;
}

export function ImagesFullScreen({
  images,
  isOpen,
  onClose,
  initialIndex = 0,
  projectName,
}: ImagesFullScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const { trackCustomEvent } = useUmami();

  // Réinitialiser l'index quand la galerie s'ouvre
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      // Tracker l'ouverture de la galerie
      trackCustomEvent('open', 'gallery', projectName || 'project_gallery');
    }
  }, [isOpen, initialIndex, projectName, trackCustomEvent]);

  // Précharger les images adjacentes
  useEffect(() => {
    const preloadImages = () => {
      const nextIndex = (currentIndex + 1) % images.length;
      const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;

      const preloadImage = (src: string) => {
        const img = new window.Image();
        img.src = src;
      };

      preloadImage(images[nextIndex]);
      preloadImage(images[prevIndex]);
    };

    preloadImages();
  }, [currentIndex, images]);

  const handlePrevious = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    trackCustomEvent('navigate', 'gallery', 'previous', currentIndex);
  };

  const handleNext = () => {
    setIsLoading(true);
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    trackCustomEvent('navigate', 'gallery', 'next', currentIndex);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') onClose();
  };

  const handleClose = () => {
    trackCustomEvent('close', 'gallery', projectName || 'project_gallery');
    onClose();
  };

  const handleImageClick = (index: number) => {
    setCurrentIndex(index);
    trackCustomEvent('select', 'gallery', `image_${index + 1}`, index);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/30 border-none outline-none backdrop-blur-md">
        <DialogTitle className="sr-only">
          {`Galerie diapos;images - Image ${currentIndex + 1} sur ${images.length}`}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {`Utilisez les flèches gauche et droite pour naviguer entre les images,
          ou cliquez sur les points en bas pour accéder directement à une image.`}
        </DialogDescription>
        <div
          className="relative w-full h-full focus:outline-none"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Image principale */}
          <div className="relative w-full h-[80vh] flex items-center justify-center">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <Image
              src={images[currentIndex]}
              alt={`Image ${currentIndex + 1} sur ${images.length}`}
              fill
              className="object-contain"
              priority
              quality={90}
              onLoadingComplete={() => setIsLoading(false)}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
          </div>

          {/* Boutons de navigation */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white hover:text-primary focus:outline-none focus:ring-0 transition-colors"
            onClick={handlePrevious}
            aria-label="Image précédente"
          >
            <ChevronLeft className="h-8 w-8" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white hover:text-primary focus:outline-none focus:ring-0 transition-colors"
            onClick={handleNext}
            aria-label="Image suivante"
          >
            <ChevronRight className="h-8 w-8" />
          </Button>

          {/* Bouton de fermeture */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white hover:text-primary focus:outline-none focus:ring-0 transition-colors"
            onClick={handleClose}
            aria-label="Fermer la galerie"
          >
            <X className="h-8 w-8" />
          </Button>

          {/* Indicateurs de position */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
            {images.map((_, index) => (
              <button
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all focus:outline-none focus:ring-0',
                  currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-primary/75',
                )}
                onClick={() => handleImageClick(index)}
                aria-label={`Aller à l'image ${index + 1}`}
                aria-current={currentIndex === index}
              />
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
