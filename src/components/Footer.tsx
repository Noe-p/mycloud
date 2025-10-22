import { cn } from '@/services/utils';
import { Col, ColCenter, RowCenter } from '@/static/styles/Flex';
import { Instagram, Mail, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import React from 'react';
import { NavKeys } from './NavBar';
import { H2, H4, P12, P14, P16, P18 } from './utils/Texts';

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps): React.JSX.Element {
  const t = useTranslations('common');

  // Même tableau que le header pour la cohérence
  const socialNetworks = [
    {
      name: 'Email',
      icon: Mail,
      href: 'mailto:test@gmail.com',
      external: false,
    },
    {
      name: 'Téléphone',
      icon: Phone,
      href: 'tel:0000000000',
      external: false,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      href: 'https://www.instagram.com',
      external: true,
    },
  ];

  return (
    <footer className={cn('w-full bg-secondary py-16 md:py-20', className)} id={NavKeys.CONTACT}>
      <ColCenter className="max-w-6xl mx-auto px-6 md:px-12 lg:px-20 text-center">
        {/* Titre principal */}
        <ColCenter className="mb-12">
          <H2 className="text-foreground mb-4">{t('footer.title')}</H2>
          <P18 className="text-muted-foreground max-w-2xl">{t('footer.subtitle')}</P18>
        </ColCenter>

        {/* Réseaux sociaux */}
        <RowCenter className="gap-6 mb-12">
          {socialNetworks.map((network) => {
            const IconComponent = network.icon;
            return (
              <a
                key={network.name}
                href={network.href}
                target={network.external ? '_blank' : undefined}
                rel={network.external ? 'noopener noreferrer' : undefined}
                className={cn(
                  'cursor-pointer transition duration-300',
                  'p-4 rounded-full bg-card',
                  'hover:scale-110 transition-all duration-300',
                  'border border-border',
                  'shadow-lg hover:shadow-xl',
                  'hover:bg-primary/20',
                )}
              >
                <IconComponent className="h-6 w-6 text-foreground" />
              </a>
            );
          })}
        </RowCenter>

        {/* Bouton de contact principal */}
        <ColCenter className="gap-4 mb-12">
          <a
            href={`${socialNetworks[0].href}?subject=Demande de devis&body=Bonjour, je souhaiterais obtenir un devis pour vos services de nettoyage.`}
            className={cn(
              'px-8 py-4 bg-primary text-primary-foreground rounded-full',
              'font-semibold text-lg',
              'hover:bg-primary/90 hover:scale-105',
              'transition-all duration-300',
              'shadow-lg hover:shadow-xl',
            )}
          >
            {t('generics.sendEmail')}
          </a>
        </ColCenter>

        {/* Informations de contact */}
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-2xl mb-12',
            'bg-card rounded-2xl p-6 md:p-8',
            'border border-border',
          )}
        >
          <ColCenter className="gap-3">
            <H4 className="text-foreground">{t('footer.contact.title')}</H4>
            <Col className="gap-2 text-center">
              <a
                href={socialNetworks[0].href}
                className={cn(
                  'text-[16px] font-mono font-normal leading-0',
                  'text-muted-foreground hover:text-accent transition-colors duration-300 cursor-pointer',
                )}
              >
                {'📧'} {t('footer.contact.email')}
              </a>
              <a
                href={socialNetworks[1].href}
                className={cn(
                  'text-[16px] font-mono font-normal leading-0',
                  'text-muted-foreground hover:text-accent transition-colors duration-300 cursor-pointer',
                )}
              >
                {'📞'} {t('footer.contact.phone')}
              </a>
            </Col>
          </ColCenter>

          <ColCenter className="gap-3">
            <H4 className="text-foreground">{t('footer.zone.title')}</H4>
            <Col className="gap-2 text-center">
              <P16 className="text-muted-foreground">
                {'📍'} {t('footer.zone.location')}
              </P16>
              <P16 className="text-muted-foreground">
                {'🕘'} {t('footer.zone.availability')}
              </P16>
            </Col>
          </ColCenter>
        </div>

        {/* Copyright et crédits */}
        <ColCenter className="gap-4 pt-8 border-t border-border">
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
      </ColCenter>
    </footer>
  );
}
