'use client';
import { AuthContextType, AuthCredentials, AuthResponse, User } from '@/types/Auth';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a un token
    const verifyToken = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const response = await fetch(`/api/auth/verify?token=${token}`);
          const data = await response.json();

          if (data.success && data.user) {
            setUser({
              username: data.user.username,
              createdAt: data.user.createdAt,
            });
          } else {
            localStorage.removeItem('auth_token');
          }
        } catch {
          localStorage.removeItem('auth_token');
        }
      }
      setIsLoading(false);
    };

    void verifyToken();
  }, []);

  const login = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        const user: User = {
          username: data.user.username,
          createdAt: data.user.createdAt,
        };

        setUser(user);
        localStorage.setItem('auth_token', data.token);

        return { success: true, user };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch {
      return { success: false, error: 'Login error' };
    }
  };

  const register = async (credentials: AuthCredentials): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.user && data.token) {
        const user: User = {
          username: data.user.username,
          createdAt: data.user.createdAt,
        };

        setUser(user);
        localStorage.setItem('auth_token', data.token);

        return { success: true, user };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch {
      return { success: false, error: 'Registration error' };
    }
  };

  const logout = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {
        // Ignore l'erreur, on supprime quand même le token localement
      }
    }

    setUser(null);
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
