'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { AvailabilitySlot } from '@eqb-platform/shared-types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Alert from '@/components/ui/Alert';
import Card from '@/components/ui/Card';

interface CoworkerInfo {
  coworkerId: string;
  coworkerName: string;
  workingHours: Record<string, Array<{ start: string; end: string; enabled: boolean }>>;
  bufferMinutes: number;
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

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function PublicBookingPage() {
  const params = useParams();
  const token = params.token as string;

  const [coworkerInfo, setCoworkerInfo] = useState<CoworkerInfo | null>(null);
  const [formData, setFormData] = useState<FormData>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    title: 'Appuntamento',
    date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'), // domani
    startTime: '10:00',
    endTime: '11:00',
    isOnline: false,
    notes: '',
  });

  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Carica info coworker
  useEffect(() => {
    if (!token) return;

    const fetchCoworkerInfo = async () => {
      try {
        const response = await fetch(`/api/public/coworker/${token}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Link di prenotazione non valido o scaduto');
          } else {
            setError('Errore nel caricamento delle informazioni');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        if (data.success) {
          setCoworkerInfo(data.data);
          setLoading(false);
        } else {
          setError(data.message || 'Errore sconosciuto');
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching coworker info:', err);
        setError('Errore di connessione');
        setLoading(false);
      }
    };

    fetchCoworkerInfo();
  }, [token]);

  // Carica slot disponibili quando cambiano data
  useEffect(() => {
    if (coworkerInfo && formData.date) {
      fetchAvailableSlots();
    }
  }, [coworkerInfo, formData.date]);

  const fetchAvailableSlots = async () => {
    if (!coworkerInfo) return;

    try {
      setLoadingSlots(true);
      const response = await fetch(
        `/api/appointments/availability/${coworkerInfo.coworkerId}?date=${formData.date}`
      );

      if (!response.ok) {
        throw new Error('Errore nel caricamento dei slot');
      }

      const data = await response.json();
      if (data.success && data.data) {
        const slots = data.data.map((slot: AvailabilitySlot) => ({
          time: `${format(new Date(slot.startTime), 'HH:mm')} - ${format(new Date(slot.endTime), 'HH:mm')}`,
          available: true,
        }));
        setTimeSlots(slots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError('Errore nel caricamento dei slot disponibili');
    } finally {
      setLoadingSlots(false);
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
      setError('Nome è obbligatorio');
      return false;
    }

    if (!formData.clientEmail.trim() || !formData.clientEmail.includes('@')) {
      setError('Email valida è obbligatoria');
      return false;
    }

    if (!formData.date || !formData.startTime || !formData.endTime) {
      setError('Data e orario sono obbligatori');
      return false;
    }

    const startDate = new Date(`${formData.date}T${formData.startTime}`);
    const endDate = new Date(`${formData.date}T${formData.endTime}`);

    if (startDate >= endDate) {
      setError('L\'orario di fine deve essere dopo l\'orario di inizio');
      return false;
    }

    return true;
  };

  const handleSelectTime = (timeStr: string) => {
    const [start, end] = timeStr.split(' - ');
    setFormData((prev) => ({
      ...prev,
      startTime: start,
      endTime: end,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!validateForm() || !token) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        clientName: formData.clientName,
        clientEmail: formData.clientEmail,
        clientPhone: formData.clientPhone || undefined,
        title: formData.title,
        startTime: new Date(`${formData.date}T${formData.startTime}`).toISOString(),
        endTime: new Date(`${formData.date}T${formData.endTime}`).toISOString(),
        isOnline: formData.isOnline,
        notes: formData.notes,
      };

      const response = await fetch(`/api/public/book/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Errore durante la prenotazione');
      }

      setSuccess(
        'Richiesta inviata con successo! Riceverai una conferma via email entro 24 ore.'
      );

      // Reset form
      setFormData({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        title: 'Appuntamento',
        date: format(new Date(Date.now() + 86400000), 'yyyy-MM-dd'),
        startTime: '10:00',
        endTime: '11:00',
        isOnline: false,
        notes: '',
      });

      // Redirect dopo 2 secondi
      setTimeout(() => {
        window.location.href = '/book-success';
      }, 2000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la prenotazione';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Caricamento in corso...</p>
        </div>
      </div>
    );
  }

  if (!coworkerInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <Alert
            type="error"
            message={
              error ||
              'Link di prenotazione non valido. Verifica il link e riprova.'
            }
          />
          <div className="text-center mt-4">
            <p className="text-gray-600 text-sm">
              Se il problema persiste, contatta direttamente il coworker.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Prenota un appuntamento
          </h1>
          <p className="text-gray-600">
            con <span className="font-semibold">{coworkerInfo.coworkerName}</span>
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}
        {success && (
          <Alert
            type="success"
            message={success}
            onClose={() => setSuccess(null)}
            className="mb-6"
          />
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Le tue informazioni</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <Input
                  id="clientName"
                  type="text"
                  name="clientName"
                  value={formData.clientName}
                  onChange={handleInputChange}
                  placeholder="Mario Rossi"
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
                  placeholder="mario@example.com"
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
          </Card>

          {/* Appointment Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Dettagli appuntamento</h2>

            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Argomento
                </label>
                <Input
                  id="title"
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Es. Consultazione progetto"
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
                  min={format(new Date(Date.now() + 86400000), 'yyyy-MM-dd')}
                  required
                />
              </div>

              {loadingSlots ? (
                <div className="text-sm text-gray-600">
                  ⏳ Caricamento slot disponibili...
                </div>
              ) : timeSlots.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Seleziona orario *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {timeSlots.map((slot, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectTime(slot.time)}
                        className={`p-3 rounded-lg border-2 font-medium text-sm transition-all ${
                          `${formData.startTime} - ${formData.endTime}` === slot.time
                            ? 'border-blue-600 bg-blue-50 text-blue-900'
                            : 'border-gray-300 bg-white hover:border-blue-400'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
                  ⚠️ Nessun slot disponibile per questa data
                </div>
              )}

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Note o informazioni aggiuntive (opzionale)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Descrivi il motivo della riunione o aggiungi dettagli..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </Card>

          {/* Appointment Type */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Tipo di appuntamento</h2>

            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isOnline"
                  checked={!formData.isOnline}
                  onChange={() => setFormData((prev) => ({ ...prev, isOnline: false }))}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">In Persona 📍</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="isOnline"
                  checked={formData.isOnline}
                  onChange={() => setFormData((prev) => ({ ...prev, isOnline: true }))}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Online 🎥</span>
              </label>
            </div>

            {formData.isOnline && (
              <p className="text-sm text-blue-600 mt-3">
                ✓ Un link Google Meet sarà incluso nella email di conferma
              </p>
            )}
          </Card>

          {/* Submit Button */}
          <div className="text-center">
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || loadingSlots}
              className="px-8 py-3 text-lg"
            >
              {submitting ? 'Prenotazione in corso...' : 'Conferma Prenotazione'}
            </Button>
            <p className="text-sm text-gray-600 mt-3">
              Riceverai una email di conferma entro 24 ore
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
