'use client';
import { Button } from '@/components/ui/button';
import { RowCenter } from '@/components/utils/Flex';
import { useTranslations } from 'next-intl';
import React from 'react';

interface AuthSwitchProps {
  mode: 'login' | 'register';
  onSwitch: () => void;
}

export function AuthSwitch({ mode, onSwitch }: AuthSwitchProps): React.JSX.Element {
  const t = useTranslations('common');

  return (
    <RowCenter className="gap-2 text-sm text-muted-foreground">
      <span>{mode === 'login' ? t('auth.noAccount') : t('auth.hasAccount')}</span>
      <Button variant="link" onClick={onSwitch} className="p-0 h-auto font-normal">
        {mode === 'login' ? t('auth.switchToRegister') : t('auth.switchToLogin')}
      </Button>
    </RowCenter>
  );
}
