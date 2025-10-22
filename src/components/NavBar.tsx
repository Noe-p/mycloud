'use client';

import { cn } from '@/services/utils';
import { Col, Row } from '@/static/styles/Flex';
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
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Progress } from './ui/progress';
import { H1, P16 } from './utils/Texts';

interface NavBarProps {
  className?: string;
}

export function NavBar({ className }: NavBarProps): React.JSX.Element {
  const tCommons = useTranslations('common');
  const { mediaCounts } = useAppContext();
  const { handleScan, loading } = useScan();
  const [open, setOpen] = React.useState(false);
  const [scanProgress, setScanProgress] = React.useState<ScanState | null>(null);

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

  const onScan = async () => {
    setOpen(false);
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
          <H1 className="">{tCommons('navbar.title')}</H1>
          <P16 className="">{tCommons('navbar.nbElements', { count: mediaCounts.total })}</P16>
        </Col>

        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <MoreVertical className="h-5 w-5 text-black" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{tCommons('navbar.menu.title')}</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 py-4 space-y-2">
              <Button
                onClick={() => {
                  void onScan();
                }}
                disabled={loading}
                className="w-full justify-start"
                variant="outline"
              >
                <Scan className="mr-2 h-4 w-4" />
                {loading ? tCommons('navbar.menu.scanning') : tCommons('navbar.menu.scan')}
              </Button>
            </div>
            <DrawerFooter>
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
            <span className="text-muted-black">{tCommons('home.scanningInProgress')}</span>
            <span className="text-muted-black font-medium">
              {`${scanProgress.scanned}/${scanProgress.total}`}
            </span>
          </div>
          <Progress value={scanProgress.progress} className="h-1" />
        </div>
      )}
    </nav>
  );
}
