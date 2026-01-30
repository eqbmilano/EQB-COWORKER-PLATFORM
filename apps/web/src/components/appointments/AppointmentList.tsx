/**
 * Appointment List Component
 */
'use client';

import type React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { Appointment } from '@eqb/shared-types';

interface AppointmentListProps {
  appointments: Appointment[];
  onEdit?: (appointment: Appointment) => void;
  onCancel?: (appointmentId: string) => void;
  isLoading?: boolean;
}

export const AppointmentList: React.FC<AppointmentListProps> = ({
  appointments,
  onEdit,
  onCancel,
  isLoading = false,
}) => {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'warning';
      case 'COMPLETED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      SCHEDULED: 'Programmato',
      COMPLETED: 'Completato',
      CANCELLED: 'Cancellato',
      MODIFIED: 'Modificato',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  if (appointments.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-gray-500">Nessun appuntamento</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">📋 I tuoi Appuntamenti</h2>

      <div className="space-y-3">
        {appointments.map(appointment => (
          <div
            key={appointment.id}
            className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">{appointment.type}</h3>
                <Badge variant={getStatusBadgeVariant(appointment.status)}>
                  {getStatusLabel(appointment.status)}
                </Badge>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  📅 {new Date(appointment.startTime).toLocaleDateString('it-IT')} |{' '}
                  🕐{' '}
                  {new Date(appointment.startTime).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}{' '}
                  -{' '}
                  {new Date(appointment.endTime).toLocaleTimeString('it-IT', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p>⏱️ Durata: {appointment.durationHours} ore</p>
                <p>🏢 Sala: {appointment.roomType}</p>
                {appointment.notes && <p>📝 {appointment.notes}</p>}
              </div>
            </div>

            <div className="flex gap-2">
              {appointment.status === 'SCHEDULED' && (
                <>
                  {onEdit && (
                    <Button
                      onClick={() => onEdit(appointment)}
                      variant="secondary"
                      size="sm"
                    >
                      Modifica
                    </Button>
                  )}
                  {onCancel && (
                    <Button
                      onClick={() => onCancel(appointment.id)}
                      variant="danger"
                      size="sm"
                    >
                      Cancella
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
