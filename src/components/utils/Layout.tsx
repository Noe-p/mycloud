'use client';
import { ProtectedRoute } from '@/components/Auth';
import { Col } from '@/components/utils/Flex';
import { cn } from '@/services/utils';
import React, { ReactNode } from 'react';
import { Footer } from '../Footer';
import { NavBar } from '../NavBar';

interface LayoutProps {
  children?: ReactNode;
  className?: string;
  isProtected?: boolean;
}

export function Layout(props: LayoutProps): React.JSX.Element {
  const { children, className, isProtected = false } = props;

  const content = (
    <Col className={cn('bg-background text-foreground', className)}>
      <NavBar />
      <Page>{children}</Page>
      <Footer />
    </Col>
  );

  if (isProtected) {
    return <ProtectedRoute>{content}</ProtectedRoute>;
  }

  return content;
}

interface PageProps {
  children?: ReactNode;
}

const Page = ({ children }: PageProps) => (
  <div className={cn('lex flex-col items-center min-h-screen mb-5 md:mb-20')}>{children}</div>
);
