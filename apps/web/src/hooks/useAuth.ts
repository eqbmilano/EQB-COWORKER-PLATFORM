/**
 * useAuth Hook - Extended with role checking
 */
'use client';

import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
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
