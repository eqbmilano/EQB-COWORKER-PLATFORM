/**
 * Hook per gestire appuntamenti via API
 */
'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface Appointment {
  id: string;
  coworkerId: string;
  clientId: string;
  clientName?: string;
  startTime: string;
  endTime: string;
  type: string;
  roomType: 'Training' | 'Treatment';
  roomNumber?: number;
  notes?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentInput {
  clientId: string;
  startTime: string;
  endTime: string;
  type: string;
  roomType: 'Training' | 'Treatment';
  roomNumber?: string;
  notes?: string;
}

export interface UpdateAppointmentInput extends Partial<CreateAppointmentInput> {}

interface UseAppointmentsReturn {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: (filters?: { startDate?: string; endDate?: string }) => Promise<void>;
  createAppointment: (data: CreateAppointmentInput) => Promise<Appointment | null>;
  updateAppointment: (id: string, data: UpdateAppointmentInput) => Promise<Appointment | null>;
  deleteAppointment: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eqb-coworker-platform.onrender.com';

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }), [token]);

  const fetchAppointments = useCallback(
    async (filters?: { startDate?: string; endDate?: string }) => {
      if (!token) {
        setError('Not authenticated');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const queryParams = new URLSearchParams();
        if (filters?.startDate) queryParams.append('startDate', filters.startDate);
        if (filters?.endDate) queryParams.append('endDate', filters.endDate);

        const response = await fetch(
          `${apiUrl}/api/appointments?${queryParams.toString()}`,
          { headers }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to fetch appointments');
        }

        const data = await response.json();
        setAppointments(data.data?.appointments || []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, headers]
  );

  const createAppointment = useCallback(
    async (input: CreateAppointmentInput): Promise<Appointment | null> => {
      if (!token) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/appointments`, {
          method: 'POST',
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to create appointment');
        }

        const data = await response.json();
        const newAppointment = data.data?.appointment;

        if (newAppointment) {
          setAppointments([...appointments, newAppointment]);
        }

        return newAppointment || null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, appointments, headers]
  );

  const updateAppointment = useCallback(
    async (id: string, input: UpdateAppointmentInput): Promise<Appointment | null> => {
      if (!token) {
        setError('Not authenticated');
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/appointments/${id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to update appointment');
        }

        const data = await response.json();
        const updated = data.data?.appointment;

        if (updated) {
          setAppointments(appointments.map((a) => (a.id === id ? updated : a)));
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
    [token, apiUrl, appointments, headers]
  );

  const deleteAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      if (!token) {
        setError('Not authenticated');
        return false;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiUrl}/api/appointments/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Failed to delete appointment');
        }

        setAppointments(appointments.filter((a) => a.id !== id));
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [token, apiUrl, appointments, headers]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointment,
    deleteAppointment,
    clearError,
  };
}
