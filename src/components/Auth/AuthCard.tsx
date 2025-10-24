'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ColCenter } from '@/components/utils/Flex';
import { useTranslations } from 'next-intl';
import React, { useEffect, useState } from 'react';
import { FullPageLoader } from '../Loaders/FullPageLoader';
import { AuthForm } from './AuthForm';

interface AuthCardProps {
  onLogin: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

export function AuthCard({ onLogin, onRegister }: AuthCardProps): React.JSX.Element {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const t = useTranslations('common');

  // Vérifier si un utilisateur existe déjà
  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch('/api/auth/has-user');
        const data = await response.json();
        setMode(data.hasUser ? 'login' : 'register');
      } catch (error) {
        console.error('Error checking user:', error);
        setMode('register');
      } finally {
        setCheckingUser(false);
      }
    };

    void checkUser();
  }, []);

  const handleSubmit = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const result =
        mode === 'login' ? await onLogin(username, password) : await onRegister(username, password);

      if (!result.success) {
        setError(result.error || 'An error occurred');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitWrapper = (username: string, password: string) => {
    void handleSubmit(username, password);
  };

  if (checkingUser) {
    return <FullPageLoader />;
  }

  return (
    <ColCenter className="min-h-screen justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">
            {mode === 'login' ? t('auth.login') : t('auth.register')}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === 'login'
              ? t('auth.username') + ' & ' + t('auth.password').toLowerCase()
              : t('auth.username') + ' & ' + t('auth.password').toLowerCase()}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuthForm
            mode={mode}
            onSubmit={handleSubmitWrapper}
            isLoading={isLoading}
            error={error}
          />
        </CardContent>
      </Card>
    </ColCenter>
  );
}
