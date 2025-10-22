'use client';

import { cn } from '@/services/utils';
import { Col, Row } from '@/static/styles/Flex';
import { useTranslations } from 'next-intl';

import React from 'react';
import { H1, P16 } from './utils/Texts';

interface NavBarProps {
  className?: string;
}

export function NavBar({ className }: NavBarProps): React.JSX.Element {
  const tCommons = useTranslations('common');

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-sm py-3',
        className,
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <Row className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 items-center">
        <Col>
          <H1 className="">{tCommons('navbar.title')}</H1>
          <P16 className="text-muted-foreground">
            {tCommons('navbar.nbElements', { count: 42 })}
          </P16>
        </Col>
      </Row>
    </nav>
  );
}
