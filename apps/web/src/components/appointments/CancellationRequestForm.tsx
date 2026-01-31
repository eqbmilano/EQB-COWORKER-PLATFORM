'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface Appointment {
  id: string;
  title: string;
  startTime: string | Date;
  endTime: string | Date;
  client?: {
    firstName: string;
    lastName: string;
  };
}

interface CancellationRequestFormProps {
  appointment: Appointment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  reason: string;
  notes: string;
  urgency: 'low' | 'medium' | 'high';
}

const URGENCY_OPTIONS = [
  { value: 'low', label: 'Bassa', description: 'Posso rimandare se necessario' },
  { value: 'medium', label: 'Media', description: 'Preferisco anticipare se possibile' },
  { value: 'high', label: 'Alta', description: 'Situazione urgente' },
];

const CANCEL_REASONS = [
  { value: 'client_request', label: 'Richiesta del cliente' },
  { value: 'personal_emergency', label: 'Emergenza personale' },
  { value: 'health_issue', label: 'Problema di salute' },
  { value: 'schedule_conflict', label: 'Conflitto di agenda' },
  { value: 'other', label: 'Altro' },
];

export default function CancellationRequestForm({
  appointment,
  onSuccess,
  onCancel,
}: CancellationRequestFormProps) {
  const [formData, setFormData] = useState<FormData>({
    reason: '',
    notes: '',
    urgency: 'medium',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calcola ore rimanenti
  const appointmentDate = new Date(appointment.startTime);
  const now = new Date();
  const hoursUntil = (appointmentDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const canCancelDirectly = hoursUntil > 12;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.reason.trim()) {
      setError('Motivo della cancellazione è obbligatorio');
      return false;
    }

    if (formData.reason === 'other' && !formData.notes.trim()) {
      setError('Per favore fornisci dettagli aggiuntivi');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        reason: formData.reason,
        notes: formData.notes,
        urgency: formData.urgency,
      };

      const response = await fetch(`/api/appointments/${appointment.id}/cancel-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
          'Errore durante l\'invio della richiesta di cancellazione'
        );
      }

      setSuccess(
        'Richiesta inviata con successo! Un amministratore esaminerà la tua richiesta al più presto.'
      );

      setTimeout(() => {
        onSuccess?.();
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'invio';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-2">Richiesta di Cancellazione</h2>
          <p className="text-gray-600 text-sm mb-6">
            Appuntamento con {appointment.client?.firstName} {appointment.client?.lastName}
          </p>

          {/* Appointment Info */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Data</p>
                <p className="font-semibold">
                  {format(new Date(appointment.startTime), 'PPP', { locale: it })}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Orario</p>
                <p className="font-semibold">
                  {format(new Date(appointment.startTime), 'HH:mm')} -{' '}
                  {format(new Date(appointment.endTime), 'HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Titolo</p>
                <p className="font-semibold">{appointment.title}</p>
              </div>
              <div>
                <p className="text-gray-600">Ore rimanenti</p>
                <p className="font-semibold">{Math.round(hoursUntil)} ore</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          {!canCancelDirectly && (
            <div className="mb-6">
              <Alert
                type="warning"
                message={`⚠️ Rimangono meno di 12 ore. La tua richiesta di cancellazione dovrà essere approvata da un amministratore.`}
              />
            </div>
          )}

          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError(null)} />
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                Motivo della Cancellazione *
              </label>
              <select
                id="reason"
                name="reason"
                value={formData.reason}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Seleziona un motivo...</option>
                {CANCEL_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            {(formData.reason === 'other' || formData.reason === 'personal_emergency') && (
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Dettagli Aggiuntivi {formData.reason === 'other' ? '*' : '(opzionale)'}
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Fornisci più dettagli sulla situazione..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required={formData.reason === 'other'}
                />
              </div>
            )}

            {/* Urgency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Livello di Urgenza
              </label>
              <div className="space-y-2">
                {URGENCY_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                  >
                    <input
                      type="radio"
                      name="urgency"
                      value={option.value}
                      checked={formData.urgency === option.value}
                      onChange={handleInputChange}
                      className="mt-1 w-4 h-4"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{option.label}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Info Message */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">ℹ️ Cosa succede dopo:</span>
                <br />
                {canCancelDirectly
                  ? 'Poiché rimangono più di 12 ore, la cancellazione sarà elaborata immediatamente.'
                  : 'Un amministratore esaminerà la tua richiesta e ti contatterà il prima possibile.'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                variant="danger"
                disabled={loading}
              >
                {loading ? 'Invio in corso...' : 'Invia Richiesta di Cancellazione'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
