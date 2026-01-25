/**
 * Hook per gestire clienti via API
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  notes?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientInput {
  name: string;
  email?: string;
  phone?: string;
  companyName?: string;
  address?: string;
  city?: string;
  zipCode?: string;
  notes?: string;
}

export interface UpdateClientInput extends Partial<CreateClientInput> {}

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  fetchClients: (search?: string) => Promise<void>;
  getClient: (id: string) => Promise<Client | null>;
  createClient: (data: CreateClientInput) => Promise<Client | null>;
  updateClient: (id: string, data: UpdateClientInput) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }), [token]);

  const fetchClients = useCallback(
    async (search?: string) => {
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);

        const response = await fetch(
          `${apiUrl}/api/clients?${queryParams.toString()}`,
          { headers }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to fetch clients');
        }

        const data = await response.json();
        setClients(data.data?.clients || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, headers]
  );

  const getClient = useCallback(
    async (id: string): Promise<Client | null> => {
      if (!token) {
        setError('Not authenticated');
        return null;
      }

      try {
        const response = await fetch(`${apiUrl}/api/clients/${id}`, { headers });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to fetch client');
        }

        const data = await response.json();
        return data.data?.client || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return null;
      }
    },
    [token, apiUrl, headers]
  );

  const createClient = useCallback(
    async (input: CreateClientInput): Promise<Client | null> => {
      if (!token) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/clients`, {
          method: 'POST',
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to create client');
        }

        const data = await response.json();
        const newClient = data.data?.client;

        if (newClient) {
          setClients([...clients, newClient]);
        }

        return newClient || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, clients, headers]
  );

  const updateClient = useCallback(
    async (id: string, input: UpdateClientInput): Promise<Client | null> => {
      if (!token) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/clients/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to update client');
        }

        const data = await response.json();
        const updated = data.data?.client;

        if (updated) {
          setClients(clients.map((c) => (c.id === id ? updated : c)));
        }

        return updated || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, clients, headers]
  );

  const deleteClient = useCallback(
    async (id: string): Promise<boolean> => {
      if (!token) {
        setError('Not authenticated');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/clients/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to delete client');
        }

        setClients(clients.filter((c) => c.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, clients, headers]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    clients,
    loading,
    error,
    fetchClients,
    getClient,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  };
}
