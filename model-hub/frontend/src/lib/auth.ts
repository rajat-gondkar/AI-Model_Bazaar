/**
 * Authentication utility functions
 */

import { User, AuthResponse } from '@/types';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

export const auth = {
  /**
   * Save authentication data to localStorage
   */
  saveAuth: (authData: AuthResponse): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, authData.access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(authData.user));
    }
  },

  /**
   * Get the stored token
   */
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  /**
   * Get the stored user
   */
  getUser: (): User | null => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(USER_KEY);
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  /**
   * Clear authentication data
   */
  clearAuth: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return auth.getToken() !== null;
  },
};

export default auth;
