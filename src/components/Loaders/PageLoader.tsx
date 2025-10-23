'use client';
import { ColCenter } from '@/components/utils/Flex';
import { cn } from '@/services/utils';
import React, { useEffect, useState } from 'react';
import { Logo } from '../Medias/Logo';
import { P24 } from '../utils/Texts';

interface PageLoaderProps {
  className?: string;
}

export function PageLoader(props: PageLoaderProps): React.JSX.Element {
  const { className } = props;
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const delayThreshold = 500;
    const timeout = setTimeout(() => {
      setShowLoader(true);
    }, delayThreshold);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-screen w-full relative',
        className,
      )}
    >
      {showLoader ? (
        <ColCenter className="py-10 h-full justify-between">
          <Logo
            src="/icons/logo_128x128.webp"
            alt="Logo Sakana San"
            size={60}
            className="w-15 h-15"
            priority
          />
          <P24 className="uppercase">{'Sakana San'}</P24>
        </ColCenter>
      ) : null}
    </div>
  );
}
