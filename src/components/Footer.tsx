import { ColCenter } from '@/components/utils/Flex';
import { cn } from '@/services/utils';
import { useTranslations } from 'next-intl';
import React from 'react';
import { P12, P14 } from './utils/Texts';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): React.JSX.Element {
  const t = useTranslations('common');

  return (
    <footer className={cn('w-full bg-secondary py-16 md:py-20', className)}>
      <ColCenter className="gap-4">
        <P14 className="text-muted-foreground">{t('footer.copyright')}</P14>
        <P12 className="text-muted-foreground">
          {t('footer.designed')}{' '}
          <a
            href="https://noe-philippe.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 transition-colors duration-300 cursor-pointer underline"
          >
            {'Noé PHILIPPE'}
          </a>
        </P12>
      </ColCenter>
    </footer>
  );
}
