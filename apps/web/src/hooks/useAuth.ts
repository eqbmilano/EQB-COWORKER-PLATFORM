/**
 * useAuth Hook - Extended with role checking
 */
'use client';

import { useAuthStore, type User } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  hasRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  canAccess: (requiredRoles: string[]) => boolean;
}

export function useAuth(): UseAuthReturn {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role || 'COWORKER');
  };

  const isAdmin = () => hasRole(['ADMIN']);

  const canAccess = (requiredRoles: string[]): boolean => {
    return hasRole(requiredRoles);
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    isAdmin,
    canAccess,
  };
}
