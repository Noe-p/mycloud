'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Col } from '@/components/utils/Flex';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (username: string, password: string) => void;
  isLoading: boolean;
  error: string | null;
}

export function AuthForm({ mode, onSubmit, isLoading, error }: AuthFormProps): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const t = useTranslations('common');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!username.trim()) {
      setValidationError(t('auth.usernameRequired'));
      return;
    }

    if (!password) {
      setValidationError(t('auth.passwordRequired'));
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setValidationError(t('auth.passwordTooShort'));
      return;
    }

    onSubmit(username.trim(), password);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Col className="gap-4">
        <div className="space-y-2">
          <Label htmlFor="username">{t('auth.username')}</Label>
          <Input
            id="username"
            type="text"
            placeholder={t('auth.username')}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <Input
            id="password"
            type="password"
            placeholder={t('auth.password')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {(error || validationError) && (
          <p className="text-sm text-destructive">{error || validationError}</p>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
        </Button>
      </Col>
    </form>
  );
}
