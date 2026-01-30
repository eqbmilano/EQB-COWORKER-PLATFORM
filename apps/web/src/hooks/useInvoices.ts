/**
 * Hook useInvoices
 * Gestisce tutte le operazioni CRUD per le fatture
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

export interface Invoice {
  id: string;
  appointmentId: string;
  appointmentClientName: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvoiceInput {
  appointmentId: string;
  amount: number;
  currency?: string;
  issueDate: string;
  dueDate: string;
  status?: string;
  notes?: string;
}

export interface UpdateInvoiceInput {
  amount?: number;
  issueDate?: string;
  dueDate?: string;
  status?: string;
  notes?: string;
}

export function useInvoices() {
  const { token } = useAuthStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eqb-coworker-platform.onrender.com';

  const getErrorMessage = (data: any, fallback: string) => {
    if (!data) return fallback;
    return data.message || data.error || data.error?.message || fallback;
  };

  /**
   * Fetch all invoices
   */
  const fetchInvoices = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/invoices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile caricare le fatture'));
      }

      const data = await response.json();
      setInvoices(data.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [token, apiUrl]);

  /**
   * Get single invoice by ID
   */
  const getInvoiceById = useCallback(async (id: string) => {
    try {
      if (!token) {
        setError('Not authenticated');
        return null;
      }
      const response = await fetch(`${apiUrl}/api/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile caricare la fattura'));
      }

      const data = await response.json();
      return data.data;
    } catch (err) {
      console.error('Error fetching invoice:', err);
      return null;
    }
  }, [token, apiUrl]);

  /**
   * Create new invoice
   */
  const createInvoice = useCallback(async (input: CreateInvoiceInput) => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/invoices`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile creare la fattura'));
      }

      const data = await response.json();
      const newInvoice = data.data;
      setInvoices((prev) => [newInvoice, ...prev]);
      return newInvoice;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error creating invoice:', err);
      throw err;
    }
  }, [token, apiUrl]);

  /**
   * Update invoice
   */
  const updateInvoice = useCallback(async (id: string, input: UpdateInvoiceInput) => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/invoices/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile aggiornare la fattura'));
      }

      const data = await response.json();
      const updatedInvoice = data.data;
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === id ? updatedInvoice : inv))
      );
      return updatedInvoice;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error updating invoice:', err);
      throw err;
    }
  }, [token, apiUrl]);

  /**
   * Delete invoice
   */
  const deleteInvoice = useCallback(async (id: string) => {
    if (!token) {
      setError('Not authenticated');
      return null;
    }
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/api/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile eliminare la fattura'));
      }

      setInvoices((prev) => prev.filter((inv) => inv.id !== id));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('Error deleting invoice:', err);
      throw err;
    }
  }, [token, apiUrl]);

  /**
   * Download invoice as PDF
   */
  const downloadPDF = useCallback(async (id: string) => {
    try {
      if (!token) {
        setError('Not authenticated');
        return;
      }
      const response = await fetch(`${apiUrl}/api/invoices/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(getErrorMessage(data, 'Impossibile scaricare il PDF'));
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      throw err;
    }
  }, [token, apiUrl]);

  return {
    invoices,
    loading,
    error,
    fetchInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    downloadPDF,
  };
}
