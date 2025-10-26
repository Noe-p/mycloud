import { AlbumBreadcrumbSkeleton } from '@/components/Albums/AlbumBreadcrumbSkeleton';
import {
  Breadcrumb,
  BreadcrumbItem as BreadcrumbItemUI,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { BreadcrumbItem } from '@/types/Album';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import React from 'react';

interface AlbumBreadcrumbProps {
  breadcrumbPath: BreadcrumbItem[];
  isLoading?: boolean;
}

export function AlbumBreadcrumb({
  breadcrumbPath,
  isLoading = false,
}: AlbumBreadcrumbProps): React.JSX.Element {
  const t = useTranslations('common');

  if (isLoading || breadcrumbPath.length === 0) {
    return <AlbumBreadcrumbSkeleton />;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItemUI>
          <BreadcrumbLink asChild>
            <Link href="/">{t('navbar.title')}</Link>
          </BreadcrumbLink>
        </BreadcrumbItemUI>
        {breadcrumbPath.map((breadcrumb, index) => (
          <React.Fragment key={breadcrumb.path}>
            <BreadcrumbSeparator />
            <BreadcrumbItemUI>
              {index === breadcrumbPath.length - 1 ? (
                <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.path}>{breadcrumb.name}</Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItemUI>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
