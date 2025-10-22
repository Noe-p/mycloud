'use client';

import { cn } from '@/services/utils';
import { Col, Row } from '@/static/styles/Flex';
import { useTranslations } from 'next-intl';

import { useAppContext } from '@/contexts';
import { useScan } from '@/hooks/useScan';
import { ScanState } from '@/types/Scan';
import { MoreVertical, Scan, X } from 'lucide-react';
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
  const { mediaCounts } = useAppContext();
  const { handleScan, loading } = useScan();
  const [open, setOpen] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState<ScanState | null>(null);
  const [mediaDirs, setMediaDirs] = React.useState<string[]>([]);
  const [newFolder, setNewFolder] = React.useState<string>('');
  const [loadingFolder, setLoadingFolder] = React.useState(false);

  // Écouter les événements de progression du scan
  React.useEffect(() => {
    const handleScanProgress = (event: CustomEvent<ScanState>) => {
      setScanProgress(event.detail);
    };

    window.addEventListener('scanProgress', handleScanProgress as EventListener);

    return () => {
      window.removeEventListener('scanProgress', handleScanProgress as EventListener);
    };
  }, []);

  // Charger les dossiers actuels au montage
  React.useEffect(() => {
    const loadCurrentFolders = async () => {
      try {
        const res = await fetch('/api/media-dir');
        const data = await res.json();
        if (data.mediaDirs && Array.isArray(data.mediaDirs)) {
          setMediaDirs(data.mediaDirs);
        }
      } catch (error) {
        console.error('Error loading current folders:', error);
      }
    };
    void loadCurrentFolders();
  }, []);

  const onScan = async () => {
    setOpen(false);
    await handleScan();
  };

  const handleAddFolder = async (folderPath: string) => {
    if (!folderPath.trim()) return;

    setLoadingFolder(true);
    try {
      // Ajouter le nouveau dossier à la liste existante
      const updatedDirs = [...mediaDirs, folderPath.trim()];

      const res = await fetch('/api/media-dir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaDirs: updatedDirs }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMediaDirs(data.mediaDirs);
        setNewFolder('');
      } else {
        alert(`Error: ${data.error || 'Failed to add folder'}`);
      }
    } catch (error) {
      console.error('Error adding folder:', error);
      alert('Failed to add folder');
    } finally {
      setLoadingFolder(false);
    }
  };

  const handleRemoveFolder = async (folderPath: string) => {
    setLoadingFolder(true);
    try {
      const res = await fetch('/api/media-dir', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mediaDir: folderPath }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMediaDirs(data.mediaDirs);
      } else {
        alert(`Error: ${data.error || 'Failed to remove folder'}`);
      }
    } catch (error) {
      console.error('Error removing folder:', error);
      alert('Failed to remove folder');
    } finally {
      setLoadingFolder(false);
    }
  };

  return (
    <nav
      className={cn('fixed top-0 left-0 w-full z-50 bg-background/40 backdrop-blur-sm', className)}
      role="navigation"
      aria-label="Main navigation"
    >
      <Row className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 items-center h-22 justify-between">
        <Col>
          <H1 className="">{tCommons('navbar.title')}</H1>
          <P16 className="">{tCommons('navbar.nbElements', { count: mediaCounts.total })}</P16>
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => {
                            void handleRemoveFolder(dir);
                          }}
                          disabled={loadingFolder}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Ajouter un nouveau dossier */}
              <div className="space-y-2">
                <input
                  type="text"
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                  placeholder={tCommons('navbar.menu.folderPlaceholder')}
                  className="w-full px-3 py-2 text-sm rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newFolder.trim()) {
                      void handleAddFolder(newFolder);
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    void handleAddFolder(newFolder);
                  }}
                  disabled={loadingFolder || !newFolder.trim()}
                  className="w-full"
                  variant="outline"
                >
                  {loadingFolder
                    ? tCommons('generics.loading', { defaultValue: 'Loading...' })
                    : tCommons('navbar.menu.addFolder')}
                </Button>
              </div>
            </div>
            <DrawerFooter>
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

      {/* Barre de progression du scan */}
      {scanProgress && scanProgress.isScanning && (
        <div className=" px-4 justify-center pb-2">
          <div className="flex items-center justify-between pb-2 text-xs">
            <P14>{tCommons('home.scanningInProgress')}</P14>
            <P12>{`${scanProgress.scanned}/${scanProgress.total}`}</P12>
          </div>
          <Progress value={scanProgress.progress} className="h-1" />
        </div>
      )}
    </nav>
  );
}
