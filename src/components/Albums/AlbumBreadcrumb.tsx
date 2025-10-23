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
}

export function AlbumBreadcrumb({ breadcrumbPath }: AlbumBreadcrumbProps): React.JSX.Element {
  const t = useTranslations('common');

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
