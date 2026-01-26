/**
 * Calendar View Component
 */
'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale';
import { useAppointments } from '@/hooks/useAppointments';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CalendarView() {
  const { appointments, fetchAppointments } = useAppointments();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthDays, setMonthDays] = useState<Date[]>([]);

  useEffect(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });
    setMonthDays(days);

    // Fetch appointments for the month
    fetchAppointments({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }, [currentDate, fetchAppointments]);

  const goToPreviousMonth = () => {
    const prev = new Date(currentDate);
    prev.setMonth(prev.getMonth() - 1);
    setCurrentDate(prev);
  };

  const goToNextMonth = () => {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    setCurrentDate(next);
  };

  const getDayAppointments = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    return appointments.filter((apt) => {
      const aptDate = new Date(apt.startTime);
      return aptDate >= dayStart && aptDate <= dayEnd;
    });
  };

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Calendario</h1>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4">
        <button
          onClick={goToPreviousMonth}
          aria-label="Mese precedente"
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronLeft className="w-5 h-5 text-slate-300" />
        </button>

        <h2 className="text-2xl font-bold text-white">
          {format(currentDate, 'MMMM yyyy', { locale: it })}
        </h2>

        <button
          onClick={goToNextMonth}
          aria-label="Prossimo mese"
          className="p-2 hover:bg-white/10 rounded-lg transition"
        >
          <ChevronRight className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg overflow-hidden">
        {/* Week Days Header */}
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((day) => (
            <div
              key={day}
              className="bg-white/5 border-b border-r border-white/10 p-3 text-center font-medium text-slate-300 text-sm"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-0">
          {monthDays.map((day) => {
            const dayAppointments = getDayAppointments(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 border-b border-r border-white/10 p-2 ${
                  isCurrentMonth ? 'bg-white/5' : 'bg-white/[0.02]'
                } ${isToday ? 'ring-inset ring-2 ring-indigo-500' : ''}`}
              >
                <div className={`text-xs font-medium mb-1 ${isToday ? 'text-indigo-400' : 'text-slate-400'}`}>
                  {format(day, 'd')}
                </div>

                <div className="space-y-1">
                  {dayAppointments.slice(0, 2).map((apt) => (
                    <div
                      key={apt.id}
                      className="text-xs bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 rounded px-1 py-0.5 truncate hover:bg-indigo-500/30 transition cursor-pointer"
                      title={`${format(new Date(apt.startTime), 'HH:mm')} - ${apt.clientName || apt.clientId}`}
                    >
                      {format(new Date(apt.startTime), 'HH:mm')} {apt.type}
                    </div>
                  ))}

                  {dayAppointments.length > 2 && (
                    <div className="text-xs text-slate-400">
                      +{dayAppointments.length - 2} altri
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span>Appuntamenti</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 ring-2 ring-indigo-500"></div>
          <span>Oggi</span>
        </div>
      </div>
    </div>
  );
}
