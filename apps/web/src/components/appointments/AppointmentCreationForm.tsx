'use client';

import { useState, useEffect } from 'react';
import { format, isBefore, startOfDay } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface AppointmentCreationFormProps {
  coworkerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  isOnline: boolean;
  notes: string;
}

interface AvailableSlot {
  startTime: string;
  endTime: string;
}

interface AvailabilitySlot {
  startTime: string;
  endTime: string;
}

export default function AppointmentCreationForm({
  coworkerId,
  onSuccess,
  onCancel,
}: AppointmentCreationFormProps) {
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    title: 'Nuovo appuntamento',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '10:00',
    endTime: '11:00',
    isOnline: false,
    notes: '',
  });

  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  // Carica slot disponibili quando cambiano data o coworker
  useEffect(() => {
    if (coworkerId && formData.date) {
      fetchAvailableSlots();
    }
  }, [coworkerId, formData.date]);

  const fetchAvailableSlots = async () => {
    try {
      setValidating(true);
      const response = await fetch(
        `/api/appointments/availability/${coworkerId}?date=${formData.date}`
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento degli slot disponibili');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setAvailableSlots(
          data.data.map((slot: AvailabilitySlot) => ({
            startTime: format(new Date(slot.startTime), 'HH:mm'),
            endTime: format(new Date(slot.endTime), 'HH:mm'),
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Errore nel caricamento dei slot disponibili');
    } finally {
      setValidating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formData.clientName.trim()) {
      setError('Nome del cliente è obbligatorio');
      return false;
    }

    if (!formData.clientEmail.trim() || !formData.clientEmail.includes('@')) {
      setError('Email valida è obbligatoria');
      return false;
    }

    if (!formData.date) {
      setError('Data è obbligatoria');
      return false;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Orario di inizio e fine sono obbligatori');
      return false;
    }

    const startDate = new Date(`${formData.date}T${formData.startTime}`);
    const endDate = new Date(`${formData.date}T${formData.endTime}`);

    if (startDate >= endDate) {
      setError('L\'orario di fine deve essere dopo l\'orario di inizio');
      return false;
    }

    if (isBefore(startDate, startOfDay(new Date()))) {
      setError('Non puoi creare appuntamenti nel passato');
      return false;
    }

    // Verifica se lo slot è disponibile
    const isSlotAvailable = availableSlots.some(
      (slot) =>
        slot.startTime === formData.startTime &&
        slot.endTime === formData.endTime
    );

    if (!isSlotAvailable && availableSlots.length > 0) {
      setError('Lo slot selezionato non è disponibile');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        title: formData.title,
        startTime: new Date(`${formData.date}T${formData.startTime}`),
        endTime: new Date(`${formData.date}T${formData.endTime}`),
        isOnline: formData.isOnline,
        notes: formData.notes,
        coworkerId: coworkerId,
      };

      const response = await fetch('/api/appointments/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante la creazione dell\'appuntamento');
      }

      const data = await response.json();
      setSuccess(`Appuntamento creato con successo! ID: ${data.data?.appointmentId}`);

      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        title: 'Nuovo appuntamento',
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00',
        isOnline: false,
        notes: '',
      });

      // Callback success
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la creazione';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Crea Nuovo Appuntamento</h2>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
      {success && <Alert type="success" message={success} onClose={() => setSuccess(null)} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente Info */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Informazioni Cliente</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                Nome Cliente *
              </label>
              <Input
                id="clientName"
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="Es. Mario Rossi"
                required
              />
            </div>

            <div>
              <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                id="clientEmail"
                type="email"
                name="clientEmail"
                value={formData.clientEmail}
                onChange={handleInputChange}
                placeholder="cliente@example.com"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Telefono (opzionale)
              </label>
              <Input
                id="clientPhone"
                type="tel"
                name="clientPhone"
                value={formData.clientPhone}
                onChange={handleInputChange}
                placeholder="+39 3xx xxx xxxx"
              />
            </div>
          </div>
        </div>

        {/* Appuntamento Details */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Dettagli Appuntamento</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titolo
              </label>
              <Input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Es. Riunione di progetto"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Data *
              </label>
              <Input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                min={format(new Date(), 'yyyy-MM-dd')}
                required
              />
            </div>

            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Ora Inizio *
              </label>
              <Input
                id="startTime"
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                Ora Fine *
              </label>
              <Input
                id="endTime"
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Note (opzionale)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Aggiungi note o informazioni aggiuntive..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tipo Appuntamento */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Tipo di Appuntamento</h3>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isOnline"
                value="false"
                checked={!formData.isOnline}
                onChange={() => setFormData((prev) => ({ ...prev, isOnline: false }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">In Persona</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isOnline"
                value="true"
                checked={formData.isOnline}
                onChange={() => setFormData((prev) => ({ ...prev, isOnline: true }))}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Online (Google Meet)</span>
            </label>
          </div>

          {formData.isOnline && (
            <p className="text-sm text-blue-600 mt-2">
              ℹ️ Un link Google Meet verrà automaticamente generato e incluso nell'email di conferma
            </p>
          )}
        </div>

        {/* Available Slots Info */}
        {validating ? (
          <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700">
            Caricamento slot disponibili...
          </div>
        ) : availableSlots.length > 0 ? (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-2">✓ Slot disponibili:</p>
            <div className="flex flex-wrap gap-2">
              {availableSlots.slice(0, 5).map((slot, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-md"
                >
                  {slot.startTime} - {slot.endTime}
                </span>
              ))}
              {availableSlots.length > 5 && (
                <span className="text-xs text-green-600">+{availableSlots.length - 5} altri</span>
              )}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
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
            variant="primary"
            disabled={loading || validating}
          >
            {loading ? 'Creazione in corso...' : 'Crea Appuntamento'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
