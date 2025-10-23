'use client';

import { Col, Row } from '@/components/utils/Flex';
import { cn } from '@/services/utils';
import { useTranslations } from 'next-intl';

import { useAppContext } from '@/contexts';
import { useScan } from '@/hooks/useScan';
import { ScanState } from '@/types/Scan';
import { MoreVertical, Scan } from 'lucide-react';
import React from 'react';
import { Button } from './ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Progress } from './ui/progress';
import { H1, P12, P14, P16 } from './utils/Texts';

interface NavBarProps {
  className?: string;
}

export function NavBar({ className }: NavBarProps): React.JSX.Element {
  const tCommons = useTranslations('common');
  const { mediaCounts, currentAlbum } = useAppContext();
  const { handleScan, loading } = useScan();
  const [open, setOpen] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState<ScanState | null>(null);
  const [mediaDirs, setMediaDirs] = React.useState<string[]>([]);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // Se connecter au SSE au montage pour recevoir les mises à jour en temps réel
  React.useEffect(() => {
    // Créer la connexion SSE
    const eventSource = new EventSource('/api/scan-progress');

    eventSource.onmessage = (event) => {
      try {
        const data: unknown = event.data;
        if (typeof data !== 'string') return;

        const state = JSON.parse(data) as ScanState;

        // Ignorer le message de connexion initial
        if (
          'type' in state &&
          'type' in (state as Record<string, unknown>) &&
          (state as Record<string, unknown>).type === 'connected'
        ) {
          return;
        }

        setScanProgress(state);

        // Émettre un événement pour d'autres composants si nécessaire
        window.dispatchEvent(
          new CustomEvent('scanProgress', {
            detail: state,
          }),
        );
      } catch (error) {
        console.error('Erreur parsing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Erreur connexion SSE:', error);
      // Tenter de reconnecter automatiquement après 5 secondes
      setTimeout(() => {
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // Le EventSource se reconnecte automatiquement
      }, 5000);
    };

    eventSourceRef.current = eventSource;

    // Cleanup à la déconnexion
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Charger les dossiers actuels au montage
  React.useEffect(() => {
    const loadCurrentFolders = async () => {
      try {
        const res = await fetch('/api/media-dir');
        const data = await res.json();
        if (data.mediaDirs && Array.isArray(data.mediaDirs)) {
          setMediaDirs(data.mediaDirs as string[]);
        }
      } catch (error) {
        console.error('Error loading current folders:', error);
      }
    };
    void loadCurrentFolders();
  }, []);

  const onScan = async () => {
    await handleScan();
  };

  return (
    <nav
      className={cn('fixed top-0 left-0 w-full z-50 bg-background/40 backdrop-blur-sm', className)}
      role="navigation"
      aria-label="Main navigation"
    >
      <Row className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 items-center h-22 justify-between">
        <Col>
          <H1 className="">{currentAlbum ? currentAlbum.name : tCommons('navbar.title')}</H1>
          <P16 className="">
            {currentAlbum ? (
              <>
                {currentAlbum.mediaCount}{' '}
                {currentAlbum.mediaCount === 1 ? tCommons('album.media') : tCommons('album.medias')}
                {currentAlbum.subAlbumsCount > 0 && (
                  <>
                    {' - '}
                    {currentAlbum.subAlbumsCount}{' '}
                    {currentAlbum.subAlbumsCount === 1
                      ? tCommons('album.subAlbum')
                      : tCommons('album.subAlbums')}
                  </>
                )}
              </>
            ) : mediaCounts.totalMedias !== undefined && mediaCounts.totalAlbums !== undefined ? (
              <>
                {mediaCounts.totalMedias}{' '}
                {mediaCounts.totalMedias === 1 ? tCommons('album.media') : tCommons('album.medias')}
                {mediaCounts.totalAlbums > 0 && (
                  <>
                    {' - '}
                    {mediaCounts.totalAlbums}{' '}
                    {mediaCounts.totalAlbums === 1
                      ? tCommons('album.subAlbum')
                      : tCommons('album.subAlbums')}
                  </>
                )}
              </>
            ) : (
              tCommons('navbar.nbElements', { count: mediaCounts.total })
            )}
          </P16>
        </Col>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MoreVertical className="h-5 w-5 text-foreground" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerTitle className="sr-only">
              {tCommons('navbar.menu.title', { defaultValue: 'Menu' })}
            </DrawerTitle>
            <div className="px-4 pb-4 pt-10 space-y-6">
              {/* Liste des dossiers actuels */}
              <div className="space-y-2">
                <P12 className="font-medium text-muted-foreground">
                  {tCommons('navbar.menu.currentFolders')}
                </P12>
                {mediaDirs.length === 0 ? (
                  <P12 className="text-muted-foreground italic">
                    {tCommons('navbar.menu.noFolders')}
                  </P12>
                ) : (
                  <div className="space-y-2">
                    {mediaDirs.map((dir, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 border border-border"
                      >
                        <P12 className="truncate text-foreground flex-1">{dir}</P12>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DrawerFooter>
              {/* Barre de progression du scan */}
              {scanProgress && scanProgress.isScanning && (
                <div className="w-full mb-4">
                  <div className="flex items-center justify-between pb-2 text-xs">
                    <P14>{tCommons('home.scanningInProgress')}</P14>
                    <P12>{`${scanProgress.scanned}/${scanProgress.total}`}</P12>
                  </div>
                  <Progress value={scanProgress.progress} className="h-1" />
                </div>
              )}

              {/* Bouton de scan */}
              <Button
                onClick={() => {
                  void onScan();
                }}
                disabled={loading || mediaDirs.length === 0}
                className="w-full justify-start"
                variant="default"
              >
                <Scan className="mr-2 h-4 w-4" />
                {loading ? tCommons('navbar.menu.scanning') : tCommons('navbar.menu.scan')}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">{tCommons('generics.close')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </Row>
    </nav>
  );
}
