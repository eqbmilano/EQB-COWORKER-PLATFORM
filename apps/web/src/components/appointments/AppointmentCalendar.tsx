/**
 * Appointment Calendar Component for React
 */
'use client';

import type React from 'react';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { Appointment } from '@eqb/shared-types';

export const AppointmentCalendar: React.FC = () => {
  const [appointments, _setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [_isLoading, _setIsLoading] = useState(false);
  const [error, _setError] = useState<string | null>(null);

  const daysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const renderCalendarDays = () => {
    const days = [];
    const totalDays = daysInMonth(selectedDate);
    const firstDay = firstDayOfMonth(selectedDate);

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days of the month
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
      const isToday = date.toDateString() === new Date().toDateString();
      const isSelected = date.toDateString() === selectedDate.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`p-2 text-center rounded border ${
            isSelected
              ? 'bg-blue-600 text-white'
              : isToday
              ? 'bg-blue-100 border-blue-300'
              : 'border-gray-200'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const handlePrevMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">📅 Calendario Appuntamenti</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-4">
          <Button onClick={handlePrevMonth} variant="secondary" size="sm">
            ← Mese Precedente
          </Button>
          <h3 className="text-lg font-semibold">
            {selectedDate.toLocaleDateString('it-IT', {
              month: 'long',
              year: 'numeric',
            })}
          </h3>
          <Button onClick={handleNextMonth} variant="secondary" size="sm">
            Mese Successivo →
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
            <div key={day} className="font-bold text-center text-gray-600">
              {day}
            </div>
          ))}
          {renderCalendarDays()}
        </div>

        {/* Appointments for Selected Date */}
        <div>
          <h4 className="text-lg font-semibold mb-2">
            Appuntamenti per {selectedDate.toLocaleDateString('it-IT')}
          </h4>
          <div className="bg-gray-50 p-4 rounded border border-gray-200 min-h-24">
            {appointments.length === 0 ? (
              <p className="text-gray-500">Nessun appuntamento per questo giorno</p>
            ) : (
              <ul className="space-y-2">
                {appointments.map(apt => (
                  <li key={apt.id} className="flex justify-between items-center p-2 bg-white rounded border">
                    <div>
                      <p className="font-semibold">{apt.type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.startTime).toLocaleTimeString('it-IT')} -{' '}
                        {new Date(apt.endTime).toLocaleTimeString('it-IT')}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {apt.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
