'use client';

import { cn } from '@/services/utils';
import { Row, RowBetween, RowCenter } from '@/static/styles/Flex';
import { Menu, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import React, { useState } from 'react';
import { H3, P16 } from './utils/Texts';

interface NavBarProps {
  className?: string;
}

export enum NavKeys {
  HOME = 'HOME',
  SERVICES = 'SERVICES',
  CONTACT = 'CONTACT',
  TESTIMONIALS = 'TESTIMONIALS',
}

export function NavBar({ className }: NavBarProps): React.JSX.Element {
  const tCommons = useTranslations('common');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const Nav = [
    {
      key: NavKeys.HOME,
      href: `#${NavKeys.HOME}`,
      label: tCommons('navbar.home'),
    },
    {
      key: NavKeys.SERVICES,
      href: `#${NavKeys.SERVICES}`,
      label: tCommons('navbar.services'),
    },
    {
      key: NavKeys.TESTIMONIALS,
      href: `#${NavKeys.TESTIMONIALS}`,
      label: tCommons('navbar.testimonials'),
    },
    {
      key: NavKeys.CONTACT,
      href: `#${NavKeys.CONTACT}`,
      label: tCommons('navbar.contact'),
    },
  ];

  const handleNavClick = (navKey: string) => {
    console.log('Navigating to:', navKey);
    closeMobileMenu();

    // Use setTimeout to ensure DOM is ready and mobile menu is closed
    setTimeout(() => {
      const element = document.getElementById(navKey);
      console.log('Element found:', element);

      if (element) {
        const offset = 80; // Adjust for fixed navbar
        const yPos = element.getBoundingClientRect().top + window.scrollY - offset;

        window.scrollTo({
          top: yPos,
          behavior: 'smooth',
        });
      } else {
        console.warn(`Element with id "${navKey}" not found`);
        // List all elements with IDs for debugging
        const allElementsWithIds = document.querySelectorAll('[id]');
        console.log(
          'All elements with IDs:',
          Array.from(allElementsWithIds).map((el) => el.id),
        );
      }
    }, 100);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLanguageChange = (lang: string) => {
    const segments = pathname.split('/').filter(Boolean);
    const pathWithoutLocale =
      segments[0] === 'en' || segments[0] === 'fr'
        ? segments.slice(1).join('/')
        : segments.join('/');

    router.push(`/${lang}/${pathWithoutLocale}`);
  };

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 w-full z-50 bg-background/90 backdrop-blur-sm border-b border-border/50',
        'transition-all duration-300 ease-in-out',
        className,
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <RowBetween className="px-6 md:px-12 lg:px-20 py-4 max-w-7xl mx-auto">
        <RowCenter className="gap-3">
          <Link href="/" className={cn('cursor-pointer transition duration-300')}>
            <Image
              src="/logo.webP"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg scale-150"
              priority
            />
          </Link>
        </RowCenter>

        {/* Navigation à droite - Desktop */}
        <RowCenter className="gap-6 md:gap-8 hidden md:flex">
          {Nav.map((nav) => (
            <button
              key={nav.key}
              onClick={() => handleNavClick(nav.key)}
              className={cn(
                'cursor-pointer transition duration-300',
                'relative px-3 py-2 rounded-lg transition-all duration-300',
                'hover:text-primary hover:bg-primary/10',
                'before:absolute before:bottom-0 before:left-0 before:w-0 before:h-0.5',
                'before:bg-primary before:transition-all before:duration-300',
                'hover:before:w-full active:scale-95',
              )}
            >
              <P16>{nav.label}</P16>
            </button>
          ))}
          <Row className="gap-1">
            {['Fr', 'En'].map((lang) => (
              <React.Fragment key={lang}>
                <P16
                  className={cn(
                    'cursor-pointer transition duration-300',
                    locale === lang.toLocaleLowerCase()
                      ? 'text-primary'
                      : 'text-foreground/50 hover:text-foreground/80',
                  )}
                  onClick={() => handleLanguageChange(lang.toLocaleLowerCase())}
                >
                  {lang}
                </P16>
                {lang === 'Fr' && <P16 className={cn('text-foreground/50')}>{'/'}</P16>}
              </React.Fragment>
            ))}
          </Row>
        </RowCenter>

        {/* Navigation mobile - Dropdown personnalisé */}
        <div className="md:hidden">
          <button
            onClick={toggleMobileMenu}
            className={cn(
              'h-10 w-10 flex items-center justify-center',
              'text-foreground hover:text-primary hover:bg-primary/10',
              'transition-all duration-300 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary/20',
            )}
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </RowBetween>

      {/* Menu mobile avec animation contrôlée */}
      <div
        className={cn(
          'fixed inset-0 z-40 md:hidden',
          'transition-all duration-500 ease-in-out',
          isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible',
        )}
        style={{
          top: '79px',
        }}
      >
        {/* Overlay pour fermer en cliquant en dehors */}
        <div
          className={cn(
            'absolute inset-0 bg-background/95 backdrop-blur-md',
            'transition-opacity duration-500',
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0',
          )}
          onClick={closeMobileMenu}
        />

        {/* Menu dropdown avec animation de haut en bas */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0',
            'bg-background backdrop-blur-md',
            'shadow rounded-b-md',
            'transition-all duration-500 ease-out',
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-8 opacity-0',
          )}
        >
          <div className="px-6 py-6 space-y-4">
            {Nav.map((nav) => (
              <button
                key={nav.key}
                onClick={() => handleNavClick(nav.key)}
                className={cn(
                  'block py-4 px-4 rounded w-full text-left',
                  'bg-primary/10',
                  'transition-all duration-300',
                  'active:scale-[0.98]',
                  'border border-transparent',
                )}
              >
                <H3>{nav.label}</H3>
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
