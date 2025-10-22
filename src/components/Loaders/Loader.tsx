'use client';
import { cn } from '@/services/utils';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LoaderProps {
  className?: string;
}

export function Loader(props: LoaderProps): React.JSX.Element {
  const { className } = props;
  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    const delayThreshold = 500;
    const timeout = setTimeout(() => {
      setShowLoader(true);
    }, delayThreshold);

    return () => clearTimeout(timeout);
  }, []);

  return showLoader ? <Loader2 className={cn('mr-2 h-5 w-5 animate-spin', className)} /> : <></>;
}
