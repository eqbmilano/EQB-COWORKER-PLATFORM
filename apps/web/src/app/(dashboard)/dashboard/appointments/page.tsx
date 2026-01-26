/**
 * Appointments List Component - MVP
 */
'use client';

import { useState, useEffect } from 'react';
import { useAppointments, Appointment } from '@/hooks/useAppointments';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AppointmentsListPage() {
  const { appointments, loading, error, fetchAppointments, deleteAppointment, clearError } =
    useAppointments();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);

  // Fetch appointments on mount and when date changes
  useEffect(() => {
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    fetchAppointments({
      startDate: startOfDay.toISOString(),
      endDate: endOfDay.toISOString(),
    });
  }, [currentDate, fetchAppointments]);

  // Filter appointments by date
  useEffect(() => {
    const today = new Date(currentDate);
    today.setHours(0, 0, 0, 0);

    const filtered = appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime();
    });

    setFilteredAppointments(filtered);
  }, [appointments, currentDate]);

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler cancellare questo appuntamento?')) {
      await deleteAppointment(id);
    }
  };

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Appuntamenti</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Appuntamento
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-200 hover:text-red-100 mt-1"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <AppointmentForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchAppointments();
          }}
          editingId={editingId}
          onEditingChange={setEditingId}
        />
      )}

      {/* Date Navigation */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4">
        <button
          onClick={goToPreviousDay}
          title="Data precedente"
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>

        <div className="flex flex-col items-center">
          <p className="text-sm text-slate-300">Data selezionata</p>
          <h2 className="text-2xl font-bold text-white">
            {format(currentDate, 'EEEE, dd MMMM yyyy', { locale: it })}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            title="Torna a oggi"
            className="px-3 py-1 text-sm bg-indigo-500 hover:bg-indigo-600 text-white rounded transition"
          >
            Oggi
          </button>
          <button
            onClick={goToNextDay}
            title="Data successiva"
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-300">Caricamento appuntamenti...</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-lg">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300">Nessun appuntamento per questa data</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Crea il primo appuntamento
            </button>
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <AppointmentCard
              key={apt.id}
              appointment={apt}
              onEdit={() => {
                setEditingId(apt.id);
                setShowForm(true);
              }}
              onDelete={() => handleDelete(apt.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: () => void;
  onDelete: () => void;
}

function AppointmentCard({ appointment, onEdit, onDelete }: AppointmentCardProps) {
  const startTime = parseISO(appointment.startTime);
  const endTime = parseISO(appointment.endTime);

  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 hover:bg-white/15 transition">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          {/* Time */}
          <div className="flex items-center gap-2 text-slate-200">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span className="font-medium">
              {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
            </span>
          </div>

          {/* Client & Type */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Cliente</p>
              <p className="text-slate-50 font-medium">{appointment.clientName || appointment.clientId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide">Tipo</p>
              <p className="text-slate-50">{appointment.type}</p>
            </div>
          </div>

          {/* Room */}
          {appointment.roomNumber && (
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>
                Sala {appointment.roomNumber} ({appointment.roomType})
              </span>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <p className="text-sm text-slate-400 italic">&quot;{appointment.notes}&quot;</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            title="Modifica appuntamento"
            className="p-2 hover:bg-blue-500/20 rounded-lg transition text-blue-400 hover:text-blue-300"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            title="Elimina appuntamento"
            className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface AppointmentFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
  onEditingChange: (id: string | null) => void;
}

function AppointmentForm({ onClose, onSuccess }: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    coworkerId: '',
    startTime: '',
    endTime: '',
    type: 'Consulenza',
    roomType: 'Treatment' as const,
    roomNumber: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement create/update logic
    onSuccess();
  };

  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-slate-50">Nuovo Appuntamento</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client ID */}
          <div>
            <label htmlFor="clientId" className="block text-sm font-medium text-slate-300 mb-1">
              Cliente
            </label>
            <input
              id="clientId"
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="ID Cliente"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="appointmentType" className="block text-sm font-medium text-slate-300 mb-1">
              Tipo Appuntamento
            </label>
            <input
              id="appointmentType"
              type="text"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tipo"
            />
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-slate-300 mb-1">
              Data/Ora Inizio
            </label>
            <input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-slate-300 mb-1">
              Data/Ora Fine
            </label>
            <input
              id="endTime"
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-slate-300 mb-1">
            Note
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Note aggiuntive..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition font-medium"
          >
            Salva Appuntamento
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 rounded-lg transition"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
