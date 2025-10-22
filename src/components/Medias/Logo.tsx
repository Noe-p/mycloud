import { cn } from '@/services/utils';
import NextImage from 'next/image';
import React from 'react';

interface LogoProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({
  src,
  alt,
  size = 60,
  className,
  priority = false,
}: LogoProps): React.JSX.Element {
  return (
    <NextImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={cn('rounded', className)}
      sizes={`${size}px`}
    />
  );
}
