'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Coworker } from '@eqb/shared-types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePickerField } from '@/components/ui/date-picker-field';
import { SelectField, type SelectOption } from '@/components/ui/select-field';
import { useAuthStore } from '@/store/authStore';
import { useToastNotifications } from '@/lib/toast';

// Validation schema
const appointmentSchema = z.object({
  type: z.string().min(1, 'Tipo appuntamento è obbligatorio'),
  clientName: z.string().min(1, 'Nome cliente è obbligatorio'),
  startTime: z.string().min(1, 'Data/ora inizio è obbligatorio'),
  endTime: z.string().min(1, 'Data/ora fine è obbligatorio'),
  notes: z.string().optional(),
  coworkerId: z.string().min(1, 'Coworker è obbligatorio'),
});

type AppointmentFormData = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
  initialData?: Partial<AppointmentFormData> & { id?: string };
  appointmentId?: string;
  coworkers: Coworker[];
}

export default function AppointmentForm({
  initialData,
  appointmentId,
  coworkers,
}: AppointmentFormProps) {
  const router = useRouter();
  const { token } = useAuthStore();
  const { success, error: showError } = useToastNotifications();
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    'https://eqb-coworker-platform.onrender.com';

  const form = useForm<AppointmentFormData>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      type: initialData?.type || '',
      clientName: initialData?.clientName || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      notes: initialData?.notes || '',
      coworkerId: initialData?.coworkerId || '',
    },
  });

  const coworkerOptions: SelectOption[] = coworkers.map((c) => ({
    value: c.id,
    label: c.name,
  }));

  const onSubmit = async (data: AppointmentFormData) => {
    try {
      const url = appointmentId
        ? `${apiUrl}/api/appointments/${appointmentId}`
        : `${apiUrl}/api/appointments`;
      const method = appointmentId ? 'PUT' : 'POST';

      console.log('Sending appointment request:', { url, method, data, token });

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('API error:', errorData);
        const message =
          errorData?.message ||
          errorData?.error ||
          'Errore nel salvataggio dell\'appuntamento';
        showError(message);
        return;
      }

      const responseData = await response.json();
      success('Appuntamento salvato con successo!');
      router.push(`/dashboard/appointments`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Errore sconosciuto';
      showError(errorMessage);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <Alert
            type="error"
            message={form.formState.errors.root.message || 'Errore'}
          />
        )}

        {/* Dettagli Appuntamento */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              Dettagli Appuntamento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Tipo Appuntamento{' '}
                      <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Es. Consulenza, Massaggio..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nome Cliente <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Mario Rossi" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="coworkerId"
                render={({ field }) => (
                  <SelectField
                    control={form.control}
                    name="coworkerId"
                    label="Coworker Responsabile"
                    options={coworkerOptions}
                    required
                  />
                )}
              />
            </div>
          </div>
        </Card>

        {/* Data e Ora */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Data e Ora</h3>
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
          </div>
        </Card>

        {/* Note */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Note</h3>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <textarea
                      placeholder="Note aggiuntive sull'appuntamento..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={form.formState.isSubmitting}
          >
            Annulla
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? 'Salvataggio...'
              : appointmentId
                ? 'Aggiorna'
                : 'Crea Appuntamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
