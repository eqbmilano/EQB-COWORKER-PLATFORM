'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface CancellationRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  notes?: string;
  requestedAt: string | Date;
  hoursUntilAppointment?: number;
  reviewedAt?: string | Date;
  reviewedBy?: string;
  adminMessage?: string;
  appointment?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    client?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    coworker?: {
      companyName: string;
    };
  };
  coworker?: {
    id: string;
    companyName: string;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CancellationRequestWithDetails extends CancellationRequest {
  appointment?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    client?: {
      firstName: string;
      lastName: string;
      email: string;
    };
    coworker?: {
      companyName: string;
    };
  };
  coworker?: {
    id: string;
    companyName: string;
  };
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminCancellationDashboard() {
  const [requests, setRequests] = useState<CancellationRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewMessage, setReviewMessage] = useState('');

  // Carica richieste di cancellazione
  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const status = filterStatus === 'all' ? '' : `?status=${filterStatus}`;
      const response = await fetch(`/api/cancellation-requests${status}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Non autorizzato. Solo gli amministratori possono accedere.');
        }
        throw new Error('Errore nel caricamento delle richieste');
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (
    requestId: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      setError(null);

      const payload = {
        action,
        message: reviewMessage || undefined,
      };

      const response = await fetch(`/api/cancellation-requests/${requestId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante la revisione');
      }

      setSuccess(
        action === 'approve'
          ? 'Cancellazione approvata'
          : 'Cancellazione rifiutata'
      );

      setReviewingId(null);
      setReviewMessage('');

      // Ricarica richieste
      setTimeout(() => {
        fetchRequests();
      }, 1000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la revisione';
      setError(errorMessage);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-50', text: 'text-yellow-800', label: '⏳ In Sospeso' },
      approved: { bg: 'bg-green-50', text: 'text-green-800', label: '✓ Approvata' },
      rejected: { bg: 'bg-red-50', text: 'text-red-800', label: '✗ Rifiutata' },
    };

    const style = styles[status] || styles.pending;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getReasonLabel = (reason: string): string => {
    const reasons: Record<string, string> = {
      client_request: 'Richiesta del cliente',
      personal_emergency: 'Emergenza personale',
      health_issue: 'Problema di salute',
      schedule_conflict: 'Conflitto di agenda',
      other: 'Altro',
    };
    return reasons[reason] || reason;
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-orange-100 text-orange-800',
      high: 'bg-red-100 text-red-800',
    };
    const urgencyLabels: Record<string, string> = {
      low: 'Bassa',
      medium: 'Media',
      high: 'Alta',
    };

    return (
      <span className={`text-xs px-2 py-1 rounded ${styles[urgency] || styles.medium}`}>
        {urgencyLabels[urgency] || urgency}
      </span>
    );
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === 'all') return true;
    return req.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Caricamento richieste...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Richieste di Cancellazione</h1>
        <p className="text-gray-600">Gestisci le richieste di cancellazione degli appuntamenti</p>
      </div>

      {error && (
        <div className="mb-6">
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        </div>
      )}
      {success && (
        <div className="mb-6">
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'primary' : 'secondary'}
            onClick={() => setFilterStatus(status)}
          >
            {status === 'all' && 'Tutte'}
            {status === 'pending' && `In Sospeso (${requests.filter(r => r.status === 'pending').length})`}
            {status === 'approved' && `Approvate (${requests.filter(r => r.status === 'approved').length})`}
            {status === 'rejected' && `Rifiutate (${requests.filter(r => r.status === 'rejected').length})`}
          </Button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500 text-lg">Nessuna richiesta di cancellazione</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Client Info */}
                <div>
                  <p className="text-sm text-gray-600 font-medium">Cliente</p>
                  <p className="font-semibold">
                    {request.client?.firstName} {request.client?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{request.client?.email}</p>
                </div>

                {/* Appointment Info */}
                <div>
                  <p className="text-sm text-gray-600 font-medium">Appuntamento</p>
                  <p className="font-semibold text-sm">{request.appointment?.title}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(request.appointment?.startTime || ''), 'PPP', { locale: it })}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(request.appointment?.startTime || ''), 'HH:mm')} -{' '}
                    {format(new Date(request.appointment?.endTime || ''), 'HH:mm')}
                  </p>
                </div>

                {/* Coworker */}
                <div>
                  <p className="text-sm text-gray-600 font-medium">Coworker</p>
                  <p className="font-semibold">{request.coworker?.companyName}</p>
                </div>

                {/* Status & Time */}
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Stato</p>
                  {getStatusBadge(request.status)}
                  {request.hoursUntilAppointment !== undefined && (
                    <p className="text-sm text-gray-500 mt-2">
                      ⏱️ {Math.round(request.hoursUntilAppointment)}h rimaste
                    </p>
                  )}
                </div>
              </div>

              {/* Reason & Urgency */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Motivo</p>
                  <p className="text-sm">{getReasonLabel(request.reason)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium">Urgenza</p>
                  {getUrgencyBadge(request.urgency || 'medium')}
                </div>

                <div>
                  <p className="text-sm text-gray-600 font-medium">Richiesta inviata</p>
                  <p className="text-sm">
                    {format(new Date(request.requestedAt), 'dd/MM HH:mm', { locale: it })}
                  </p>
                </div>
              </div>

              {/* Notes */}
              {request.notes && (
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <p className="text-sm text-gray-600 font-medium mb-1">Note</p>
                  <p className="text-sm text-gray-700">{request.notes}</p>
                </div>
              )}

              {/* Review Actions */}
              {request.status === 'pending' && (
                <div className="space-y-3">
                  {reviewingId === request.id ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Messaggio di risposta (opzionale)
                        </label>
                        <textarea
                          value={reviewMessage}
                          onChange={(e) => setReviewMessage(e.target.value)}
                          placeholder="Es. Cancellazione approvata. Contattaci per riprogrammare..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setReviewingId(null);
                            setReviewMessage('');
                          }}
                        >
                          Annulla
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() => handleReview(request.id, 'approve')}
                        >
                          ✓ Approva
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleReview(request.id, 'reject')}
                        >
                          ✗ Rifiuta
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setReviewingId(request.id)}
                      className="w-full"
                    >
                      Esamina Richiesta
                    </Button>
                  )}
                </div>
              )}

              {/* Review Info */}
              {request.status !== 'pending' && request.reviewedAt && (
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <p className="text-gray-600">
                    {request.status === 'approved' ? '✓' : '✗'} Revisato da{' '}
                    <span className="font-medium">{request.reviewedBy}</span> il{' '}
                    <span className="font-medium">
                      {format(new Date(request.reviewedAt), 'dd/MM/yyyy HH:mm', {
                        locale: it,
                      })}
                    </span>
                  </p>
                  {request.adminMessage && (
                    <p className="text-gray-700 mt-2">💬 {request.adminMessage}</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
