import { P16 } from '@/components/utils/Texts';
import { useTranslations } from 'next-intl';
import React from 'react';

export function EmptyAlbumState(): React.JSX.Element {
  const t = useTranslations('common');

  return (
    <div className="text-center py-12">
      <P16 className="italic text-muted-foreground">{t('album.noMedia')}</P16>
    </div>
  );
}
