import { RowCenter } from '@/components/utils/Flex';
import React from 'react';

interface SpinnerLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6 border-2',
  md: 'w-8 h-8 border-4',
  lg: 'w-12 h-12 border-4',
};

export function SpinnerLoader({
  size = 'md',
  className = '',
}: SpinnerLoaderProps): React.JSX.Element {
  return (
    <RowCenter className={`justify-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-primary border-t-transparent rounded-full animate-spin`}
      />
    </RowCenter>
  );
}
