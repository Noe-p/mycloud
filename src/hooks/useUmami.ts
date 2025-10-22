import { trackEvent } from '@/services/umami';
import { useCallback } from 'react';

export const useUmami = () => {
  const trackCustomEvent = useCallback(
    (action: string, category: string, label?: string, value?: number) => {
      trackEvent(action, category, label, value);
    },
    [],
  );

  const trackButtonClick = useCallback((buttonName: string) => {
    trackEvent('click', 'button', buttonName);
  }, []);

  const trackProjectView = useCallback((projectName: string) => {
    trackEvent('view', 'project', projectName);
  }, []);

  const trackContactForm = useCallback((formType: string) => {
    trackEvent('submit', 'form', formType);
  }, []);

  const trackDownload = useCallback((fileName: string, fileType: string) => {
    trackEvent('download', 'file', `${fileName}.${fileType}`);
  }, []);

  return {
    trackCustomEvent,
    trackButtonClick,
    trackProjectView,
    trackContactForm,
    trackDownload,
  };
};
