/**
 * General utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }

  return formatDate(dateString);
}

/**
 * Truncate text to a maximum length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Get status color based on project status
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    launching: 'bg-blue-100 text-blue-800',
    running: 'bg-purple-100 text-purple-800',
    stopped: 'bg-gray-100 text-gray-800',
    error: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Generate a random color for avatar backgrounds
 */
export function getAvatarColor(name: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Parse API error response to get a user-friendly message
 */
export function parseApiError(error: any): string {
  // Handle axios error response
  if (error?.response?.data?.detail) {
    const detail = error.response.data.detail;
    
    // Handle array of errors (validation errors)
    if (Array.isArray(detail)) {
      return detail.map((err: any) => err.msg || err.message || String(err)).join(', ');
    }
    
    // Handle string error
    if (typeof detail === 'string') {
      return detail;
    }
    
    // Handle object error
    if (typeof detail === 'object') {
      return detail.message || detail.msg || JSON.stringify(detail);
    }
  }
  
  // Handle axios error message
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // Handle network errors
  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('Network Error')) {
    return 'Unable to connect to server. Please check your internet connection.';
  }
  
  // Handle timeout
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  
  // Handle 401
  if (error?.response?.status === 401) {
    return 'Your session has expired. Please log in again.';
  }
  
  // Handle 403
  if (error?.response?.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  // Handle 404
  if (error?.response?.status === 404) {
    return 'The requested resource was not found.';
  }
  
  // Handle 500
  if (error?.response?.status >= 500) {
    return 'Server error. Please try again later.';
  }
  
  // Fallback to error message or default
  return error?.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Get error type for styling (error, warning, info)
 */
export function getErrorType(error: any): 'error' | 'warning' | 'info' {
  if (error?.response?.status === 401 || error?.response?.status === 403) {
    return 'warning';
  }
  if (error?.response?.status >= 500) {
    return 'error';
  }
  return 'error';
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error?.response?.status === 422 || error?.response?.status === 400;
}

/**
 * Extract field-specific validation errors
 */
export function getFieldErrors(error: any): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  
  if (error?.response?.data?.detail && Array.isArray(error.response.data.detail)) {
    error.response.data.detail.forEach((err: any) => {
      if (err.loc && Array.isArray(err.loc) && err.loc.length > 1) {
        const field = err.loc[err.loc.length - 1];
        fieldErrors[field] = err.msg;
      }
    });
  }
  
  return fieldErrors;
}
