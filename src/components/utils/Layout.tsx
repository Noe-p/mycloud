'use client';
import { cn } from '@/services/utils';
import { Col } from '@/static/styles/Flex';
import React, { ReactNode } from 'react';
import { NavBar } from '../NavBar';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
}

export function Layout(props: LayoutProps): React.JSX.Element {
  const { children, className } = props;

  return (
    <Col className={cn('bg-background text-foreground', className)}>
      <NavBar />
      <Page>{children}</Page>
      {/* <Footer /> */}
    </Col>
  );
}

interface PageProps {
  children?: ReactNode;
}

const Page = ({ children }: PageProps) => (
  <div className={cn('lex flex-col items-center min-h-screen mb-5 md:mb-20')}>{children}</div>
);
