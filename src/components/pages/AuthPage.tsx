'use client';
import { AuthCard } from '@/components/Auth/AuthCard';
import { FullPageLoader } from '@/components/Loaders/FullPageLoader';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export function AuthPage(): React.JSX.Element {
  const { login, register, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleLogin = async (username: string, password: string) => {
    const result = await login({ username, password });
    return {
      success: result.success,
      ...(result.error && { error: result.error }),
    };
  };

  const handleRegister = async (username: string, password: string) => {
    const result = await register({ username, password });
    return {
      success: result.success,
      ...(result.error && { error: result.error }),
    };
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <div className="bg-background min-h-screen">
      <AuthCard onLogin={handleLogin} onRegister={handleRegister} />
    </div>
  );
}
