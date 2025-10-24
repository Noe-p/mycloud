'use client';

import { Col, Row } from '@/components/utils/Flex';
import { cn } from '@/services/utils';
import { useTranslations } from 'next-intl';

import { useAlbumsContext, useAppContext, useAuth, useMediaContext } from '@/contexts';
import { useScan } from '@/hooks/useScan';
import { useScanProgress } from '@/hooks/useScanProgress';
import { LogOut, MoreVertical, Scan } from 'lucide-react';
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
  const { currentAlbum } = useAppContext();
  const { mediaCounts } = useMediaContext();
  const { albumCounts } = useAlbumsContext();
  const { handleScan, loading } = useScan();
  const { scanProgress } = useScanProgress();
  const { logout, user } = useAuth();
  const [open, setOpen] = React.useState(false);

  const onScan = async () => {
    await handleScan();
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
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
            ) : albumCounts.totalMedias !== undefined && albumCounts.totalAlbums !== undefined ? (
              <>
                {albumCounts.totalMedias}{' '}
                {albumCounts.totalMedias === 1 ? tCommons('album.media') : tCommons('album.medias')}
                {albumCounts.totalAlbums > 0 && (
                  <>
                    {' - '}
                    {albumCounts.totalAlbums}{' '}
                    {albumCounts.totalAlbums === 1
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
            <DrawerFooter>
              {/* Barre de progression du scan */}
              {scanProgress && scanProgress.isScanning && (
                <div className="w-full mb-4">
                  <div className="flex items-center justify-between pb-2 text-xs">
                    <P14 className="text-muted-foreground">
                      {tCommons('home.scanningInProgress')}
                    </P14>
                    <P12 className="text-muted-foreground">{`${scanProgress.scanned}/${scanProgress.total}`}</P12>
                  </div>
                  <Progress value={scanProgress.progress} className="h-1" />
                </div>
              )}

              {/* Bouton de scan */}
              <Button
                onClick={() => {
                  void onScan();
                }}
                disabled={loading || (scanProgress?.isScanning ?? false)}
                isLoading={loading || (scanProgress?.isScanning ?? false)}
                className="w-full justify-start"
                variant="default"
              >
                <Scan className="mr-2 h-4 w-4" />
                {loading || scanProgress?.isScanning
                  ? tCommons('navbar.menu.scanning')
                  : tCommons('navbar.menu.scan')}
              </Button>

              {/* Bouton de déconnexion */}
              {user && (
                <Button onClick={handleLogout} className="w-full justify-start" variant="outline">
                  <LogOut className="mr-2 h-4 w-4" />
                  {tCommons('generics.logout')}
                </Button>
              )}

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
