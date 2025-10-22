import commonEN from '@/i18n/en/common.json';
import enumsEN from '@/i18n/en/enums.json';
import metasEN from '@/i18n/en/metas.json';
import projectsEN from '@/i18n/en/projects.json';
import commonFR from '@/i18n/fr/common.json';
import enumsFR from '@/i18n/fr/enums.json';
import metasFR from '@/i18n/fr/metas.json';
import projectsFR from '@/i18n/fr/projects.json';

export const messages = {
  en: {
    common: commonEN,
    enums: enumsEN,
    metas: metasEN,
    projects: projectsEN,
  },
  fr: {
    common: commonFR,
    enums: enumsFR,
    metas: metasFR,
    projects: projectsFR,
  },
};

export const locales = ['en', 'fr'] as const;
export const defaultLocale = 'fr' as const;

export async function getMessages(locale: string) {
  return messages[locale as keyof typeof messages];
}

export type Locale = keyof typeof messages;
