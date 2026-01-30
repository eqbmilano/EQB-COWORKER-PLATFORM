/**
 * Hook for admin operations - user management
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eqb-coworker-platform.onrender.com';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'COWORKER';
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
  coworkerProfile?: {
    profession: string;
    specialization: string;
    status: string;
  };
  adminProfile?: {
    permissions: string[];
  };
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'ADMIN' | 'COWORKER';
}

export function useAdmin() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async (includeInactive = false) => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiUrl}/api/admin/users?includeInactive=${includeInactive}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const result = await response.json();
      setUsers(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const createUser = useCallback(async (userData: CreateUserData) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to create user');
      }

      const result = await response.json();
      await fetchUsers();
      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchUsers]);

  const updateUserRole = useCallback(async (userId: string, role: 'ADMIN' | 'COWORKER') => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update role');
      }

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchUsers]);

  const updateUserStatus = useCallback(async (userId: string, status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to update status');
      }

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    if (!token) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || 'Failed to delete user');
      }

      await fetchUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [token, fetchUsers]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUserRole,
    updateUserStatus,
    deleteUser,
  };
}
