import commonEN from '@/i18n/en/common.json';
import enumsEN from '@/i18n/en/enums.json';
import metasEN from '@/i18n/en/metas.json';
import commonFR from '@/i18n/fr/common.json';
import enumsFR from '@/i18n/fr/enums.json';
import metasFR from '@/i18n/fr/metas.json';

export const messages = {
  en: {
    common: commonEN,
    enums: enumsEN,
    metas: metasEN,
  },
  fr: {
    common: commonFR,
    enums: enumsFR,
    metas: metasFR,
  },
};

export const locales = ['en', 'fr'] as const;
export const defaultLocale = 'fr' as const;

export async function getMessages(locale: string) {
  return messages[locale as keyof typeof messages];
}

export type Locale = keyof typeof messages;
