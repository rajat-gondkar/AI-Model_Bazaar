'use client';

/**
 * Authentication Context Provider
 * Manages global authentication state
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse } from '@/types';
import { authApi } from '@/lib/api';
import { auth as authUtils } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedUser = authUtils.getUser();
      const token = authUtils.getToken();

      if (storedUser && token) {
        try {
          // Verify token is still valid
          const currentUser = await authApi.me();
          setUser(currentUser);
        } catch (error) {
          // Token is invalid, clear auth
          authUtils.clearAuth();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response: AuthResponse = await authApi.login(credentials);
    authUtils.saveAuth(response);
    setUser(response.user);
  };

  const register = async (data: RegisterData) => {
    await authApi.register(data);
    // Auto-login after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = () => {
    authUtils.clearAuth();
    setUser(null);
  };

  const refreshUser = async () => {
    if (authUtils.getToken()) {
      try {
        const currentUser = await authApi.me();
        setUser(currentUser);
      } catch (error) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
