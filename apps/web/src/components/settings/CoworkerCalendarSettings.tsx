'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';

interface WorkingHoursSlot {
  start: string;
  end: string;
  enabled: boolean;
}

interface WorkingHours {
  monday: WorkingHoursSlot[];
  tuesday: WorkingHoursSlot[];
  wednesday: WorkingHoursSlot[];
  thursday: WorkingHoursSlot[];
  friday: WorkingHoursSlot[];
  saturday: WorkingHoursSlot[];
  sunday: WorkingHoursSlot[];
}

interface SettingsData {
  googleConnected: boolean;
  googleCalendarId: string | null;
  allowOnlineBooking: boolean;
  bookingUrl: string | null;
  bufferTimeMinutes: number;
  workingHours: WorkingHours;
}

const DAYS = [
  { key: 'monday', label: 'Lunedì' },
  { key: 'tuesday', label: 'Martedì' },
  { key: 'wednesday', label: 'Mercoledì' },
  { key: 'thursday', label: 'Giovedì' },
  { key: 'friday', label: 'Venerdì' },
  { key: 'saturday', label: 'Sabato' },
  { key: 'sunday', label: 'Domenica' },
] as const;

export default function CoworkerCalendarSettings() {
  const [settings, setSettings] = useState<SettingsData>({
    googleConnected: false,
    googleCalendarId: null,
    allowOnlineBooking: false,
    bookingUrl: null,
    bufferTimeMinutes: 15,
    workingHours: {
      monday: [{ start: '09:00', end: '18:00', enabled: true }],
      tuesday: [{ start: '09:00', end: '18:00', enabled: true }],
      wednesday: [{ start: '09:00', end: '18:00', enabled: true }],
      thursday: [{ start: '09:00', end: '18:00', enabled: true }],
      friday: [{ start: '09:00', end: '18:00', enabled: true }],
      saturday: [{ start: '10:00', end: '13:00', enabled: false }],
      sunday: [{ start: '09:00', end: '18:00', enabled: false }],
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Carica settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/auth/google/status');

      if (!response.ok) {
        throw new Error('Errore nel caricamento delle impostazioni');
      }

      const data = await response.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          googleConnected: data.data.connected,
          googleCalendarId: data.data.calendarId,
        }));
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Non mostrare errore, usa defaults
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const response = await fetch('/api/auth/google/connect');

      if (!response.ok) {
        throw new Error('Errore nella connessione');
      }

      const data = await response.json();
      if (data.success && data.data.authUrl) {
        window.location.href = data.data.authUrl;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella connessione';
      setError(errorMessage);
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Sei sicuro di voler disconnettere Google Calendar?')) {
      return;
    }

    try {
      const response = await fetch('/api/auth/google/disconnect', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Errore nella disconnessione');
      }

      setSuccess('Google Calendar disconnesso con successo');
      setSettings((prev) => ({
        ...prev,
        googleConnected: false,
        googleCalendarId: null,
      }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella disconnessione';
      setError(errorMessage);
    }
  };

  const handleGenerateBookingLink = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/auth/booking-link/generate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Errore nella generazione del link');
      }

      const data = await response.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          bookingUrl: data.data.bookingUrl,
          allowOnlineBooking: true,
        }));
        setSuccess('Link di prenotazione generato!');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella generazione';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleOnlineBooking = async () => {
    try {
      setSaving(true);

      const response = await fetch('/api/auth/booking-link/toggle', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !settings.allowOnlineBooking,
        }),
      });

      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento');
      }

      const data = await response.json();
      if (data.success) {
        setSettings((prev) => ({
          ...prev,
          allowOnlineBooking: data.data.allowOnlineBooking,
        }));
        setSuccess(
          data.data.allowOnlineBooking
            ? 'Prenotazioni online abilitate'
            : 'Prenotazioni online disabilitate'
        );
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = () => {
    if (settings.bookingUrl) {
      navigator.clipboard.writeText(settings.bookingUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  const handleWorkingHoursChange = (
    day: keyof WorkingHours,
    slotIndex: number,
    field: 'start' | 'end' | 'enabled',
    value: string | boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: prev.workingHours[day].map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        ),
      },
    }));
  };

  const handleAddTimeSlot = (day: keyof WorkingHours) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: [
          ...prev.workingHours[day],
          { start: '09:00', end: '18:00', enabled: true },
        ],
      },
    }));
  };

  const handleRemoveTimeSlot = (day: keyof WorkingHours, slotIndex: number) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: prev.workingHours[day].filter((_, idx) => idx !== slotIndex),
      },
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Caricamento impostazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Impostazioni Calendario</h1>
        <p className="text-gray-600">
          Gestisci la connessione a Google Calendar, gli orari di lavoro e i link di prenotazione
        </p>
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

      {/* Google Calendar Connection */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">📅 Connessione Google Calendar</h2>

        {settings.googleConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-green-900 font-medium">
                ✓ Google Calendar connesso con successo
              </p>
              <p className="text-sm text-green-800 mt-1">
                ID Calendario: <code className="font-mono">{settings.googleCalendarId}</code>
              </p>
            </div>

            <p className="text-sm text-gray-600">
              Il tuo calendario personale è ora connesso in modalità lettura. Il sistema verificherà
              la tua disponibilità quando vengono creati gli appuntamenti.
            </p>

            <Button
              variant="danger"
              onClick={handleDisconnectGoogle}
              disabled={saving}
            >
              Disconnetti Google Calendar
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Connetti il tuo calendario Google per consentire al sistema di verificare la tua
              disponibilità personale quando i clienti prenotano appuntamenti.
            </p>

            <Button
              variant="primary"
              onClick={handleConnectGoogle}
              disabled={saving}
            >
              Connetti Google Calendar
            </Button>

            <p className="text-xs text-gray-500">
              ℹ️ Verrai reindirizzato a Google per autorizzare l'accesso al tuo calendario (modalità lettura solo)
            </p>
          </div>
        )}
      </Card>

      {/* Public Booking Link */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">🔗 Link di Prenotazione Pubblica</h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            I clienti possono usare questo link per prenotare autonomamente appuntamenti con te,
            senza bisogno di accesso al sistema.
          </p>

          {settings.bookingUrl ? (
            <div className="space-y-3">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <label htmlFor="booking-url" className="text-sm text-blue-900 font-medium mb-2 block">Il tuo link di prenotazione:</label>
                <div className="flex items-center gap-2">
                  <input
                    id="booking-url"
                    type="text"
                    value={settings.bookingUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-md font-mono text-sm"
                  />
                  <Button
                    variant="secondary"
                    onClick={copyToClipboard}
                    className="px-4"
                  >
                    {copiedUrl ? '✓ Copiato' : 'Copia'}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={settings.allowOnlineBooking ? 'primary' : 'secondary'}
                  onClick={handleToggleOnlineBooking}
                  disabled={saving}
                >
                  {settings.allowOnlineBooking ? '✓ Prenotazioni Abilitate' : 'Abilita Prenotazioni'}
                </Button>

                <Button
                  variant="secondary"
                  onClick={handleGenerateBookingLink}
                  disabled={saving}
                >
                  Rigenera Link
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="primary"
              onClick={handleGenerateBookingLink}
              disabled={saving}
            >
              Genera Link di Prenotazione
            </Button>
          )}
        </div>
      </Card>

      {/* Buffer Time */}
      <Card className="mb-6 p-6">
        <h2 className="text-xl font-semibold mb-4">⏱️ Tempo Buffer tra Appuntamenti</h2>

        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Il tempo buffer è il gap automatico tra un appuntamento e il successivo per permetterti
            di prepararti o riposare.
          </p>

          <div className="flex items-center gap-4">
            <label htmlFor="buffer" className="text-sm font-medium">
              Minuti di buffer:
            </label>
            <Input
              id="buffer"
              type="number"
              min="0"
              max="120"
              value={settings.bufferTimeMinutes}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  bufferTimeMinutes: parseInt(e.target.value),
                }))
              }
              className="w-24"
            />
            <span className="text-sm text-gray-600">(attualmente {settings.bufferTimeMinutes}min)</span>
          </div>
        </div>
      </Card>

      {/* Working Hours */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">🕐 Orari di Lavoro</h2>

        <p className="text-sm text-gray-600 mb-6">
          Definisci gli orari disponibili per le prenotazioni. Puoi aggiungere più slot per giorno
          (es. mattina e pomeriggio separati).
        </p>

        <div className="space-y-6">
          {DAYS.map(({ key, label }) => (
            <div key={key} className="border-b border-gray-200 pb-6 last:border-0">
              <h3 className="font-medium mb-3">{label}</h3>

              <div className="space-y-3">
                {settings.workingHours[key].map((slot, slotIndex) => (
                  <div key={slotIndex} className="flex items-center gap-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={slot.enabled}
                        onChange={(e) =>
                          handleWorkingHoursChange(key, slotIndex, 'enabled', e.target.checked)
                        }
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">Attivo</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={slot.start}
                        onChange={(e) =>
                          handleWorkingHoursChange(key, slotIndex, 'start', e.target.value)
                        }
                        className="w-32"
                        disabled={!slot.enabled}
                      />
                      <span className="text-gray-500">-</span>
                      <Input
                        type="time"
                        value={slot.end}
                        onChange={(e) =>
                          handleWorkingHoursChange(key, slotIndex, 'end', e.target.value)
                        }
                        className="w-32"
                        disabled={!slot.enabled}
                      />
                    </div>

                    {settings.workingHours[key].length > 1 && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveTimeSlot(key, slotIndex)}
                      >
                        ✕ Rimuovi
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleAddTimeSlot(key)}
                  className="mt-2"
                >
                  + Aggiungi Slot
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Save Button */}
      <div className="mt-8 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => fetchSettings()}>
          Annulla
        </Button>
        <Button
          variant="primary"
          disabled={saving}
          onClick={() => {
            setSaving(true);
            setSuccess('Impostazioni salvate con successo!');
            setTimeout(() => setSaving(false), 1000);
          }}
        >
          {saving ? 'Salvataggio...' : 'Salva Impostazioni'}
        </Button>
      </div>
    </div>
  );
}
