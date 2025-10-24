import { messages } from '@/i18n/config';
import type { NextApiRequest } from 'next';

/**
 * Récupère la locale depuis les headers de la requête
 */
export function getLocaleFromRequest(req: NextApiRequest): 'fr' | 'en' {
  const acceptLanguage = req.headers['accept-language'];

  if (acceptLanguage?.includes('fr')) {
    return 'fr';
  }

  return 'en';
}

/**
 * Récupère un message traduit côté serveur
 */
export function getServerTranslation(req: NextApiRequest, key: string): string {
  const locale = getLocaleFromRequest(req);
  const keys = key.split('.');

  // Commencer avec 'common' par défaut
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let value: any = messages[locale].common;

  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Retourne la clé si non trouvée
    }
  }

  return typeof value === 'string' ? value : key;
}
