'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppointments } from '@/hooks/useAppointments';
import { useClients } from '@/hooks/useClients';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SelectField } from '@/components/ui/select-field';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { useToastNotifications } from '@/lib/toast';

const appointmentSchema = z.object({
  clientId: z.string().min(1, 'Seleziona un cliente'),
  startTime: z.date({ message: 'Data inizio è obbligatoria' }),
  endTime: z.date({ message: 'Data fine è obbligatoria' }),
  type: z.string().min(1, 'Tipo è obbligatorio'),
  roomType: z.enum(['Training', 'Treatment'], { message: 'Tipo stanza non valido' }),
  roomNumber: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => data.endTime > data.startTime, {
  message: 'Data fine deve essere dopo data inizio',
  path: ['endTime'],
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingId?: string | null;
}

export default function AppointmentForm({ onClose, onSuccess }: AppointmentFormProps) {
  const { createAppointment } = useAppointments();
  const { clients, fetchClients } = useClients();
  const { success, error: errorToast } = useToastNotifications();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      clientId: '',
      startTime: undefined,
      endTime: undefined,
      type: 'Consulenza',
      roomType: 'Treatment',
      roomNumber: '',
      notes: '',
    },
  });

  // Load clients on mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  const roomTypeOptions = [
    { value: 'Training', label: 'Training' },
    { value: 'Treatment', label: 'Trattamento' },
  ];

  const appointmentTypeOptions = [
    { value: 'Consulenza', label: 'Consulenza' },
    { value: 'Terapia', label: 'Terapia' },
    { value: 'Valutazione', label: 'Valutazione' },
    { value: 'Follow-up', label: 'Follow-up' },
  ];

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      setError(null);

      const result = await createAppointment({
        clientId: data.clientId,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
        type: data.type,
        roomType: data.roomType,
        roomNumber: data.roomNumber || undefined,
        notes: data.notes || undefined,
      });

      if (result) {
        success('Appuntamento creato con successo!');
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nella creazione dell\'appuntamento';
      setError(message);
      errorToast(message);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {error && <Alert type="error" message={error} />}

        <Card>
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold">Nuovo Appuntamento</h3>

            {/* Client Selection */}
            <SelectField
              control={form.control}
              name="clientId"
              label="Cliente"
              placeholder="Seleziona un cliente"
              options={clientOptions}
              required
            />

            {/* Appointment Type */}
            <SelectField
              control={form.control}
              name="type"
              label="Tipo Appuntamento"
              options={appointmentTypeOptions}
              required
            />

            {/* Room Type */}
            <SelectField
              control={form.control}
              name="roomType"
              label="Tipo Stanza"
              options={roomTypeOptions}
              required
            />

            {/* Room Number */}
            <FormField
              control={form.control}
              name="roomNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numero Stanza</FormLabel>
                  <FormControl>
                    <Input placeholder="es. 101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date/Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePickerField
                control={form.control}
                name="startTime"
                label="Data/Ora Inizio"
                minDate={new Date()}
              />
              <DatePickerField
                control={form.control}
                name="endTime"
                label="Data/Ora Fine"
                minDate={new Date()}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <textarea
                      placeholder="Note aggiuntive..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={form.formState.isSubmitting}
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-blue-500 text-white hover:brightness-105"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Salvataggio...' : 'Crea Appuntamento'}
              </Button>
            </div>
          </div>
        </Card>
      </form>
    </Form>
  );
}
