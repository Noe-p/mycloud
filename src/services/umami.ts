// Fonction pour tracker les événements via Umami
// Voir API client exposée par le script: window.umami.track(name, data?)
declare global {
  interface Window {
    umami?: {
      track: (name: string, data?: Record<string, unknown>) => void;
    };
  }
}

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (typeof window === 'undefined') return;

  const payload: Record<string, unknown> = {
    event_category: category,
    event_label: label,
  };

  if (typeof value === 'number') {
    payload.value = value;
  }

  // umami.track accepte un nom et un objet data
  try {
    if (window.umami && typeof window.umami.track === 'function') {
      window.umami.track(action, payload);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('Umami track error ignored', error);
    }
  }
};
