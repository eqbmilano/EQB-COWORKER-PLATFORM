'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  todayAppointments: number;
  weekAppointments: number;
  monthlyHours: number;
  totalClients: number;
}

interface UpcomingAppointment {
  id: string;
  startTime: string;
  duration: number;
  client: {
    firstName: string;
    lastName: string;
  };
  type: string;
}

export default function OperatorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch monthly hours from backlog
      const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const [backlogResponse, appointmentsResponse, clientsResponse] = await Promise.all([
        fetch(`/api/backlog/statistics?startDate=${startDate}&endDate=${endDate}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/appointments?status=SCHEDULED&limit=5', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
        fetch('/api/clients?limit=1', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }),
      ]);

      let monthlyHours = 0;
      if (backlogResponse.ok) {
        const backlogData = await backlogResponse.json();
        monthlyHours = backlogData.data.totalHours;
      }

      let appointments: UpcomingAppointment[] = [];
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        appointments = appointmentsData.data.appointments || [];
      }

      let totalClients = 0;
      if (clientsResponse.ok) {
        const clientsData = await clientsResponse.json();
        totalClients = clientsData.pagination?.total || 0;
      }

      // Calculate today and week appointments
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      const todayEnd = new Date(now.setHours(23, 59, 59, 999));
      const weekEnd = new Date(now.setDate(now.getDate() + 7));

      const todayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= todayStart && aptDate <= todayEnd;
      }).length;

      const weekAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate <= weekEnd;
      }).length;

      setStats({
        todayAppointments,
        weekAppointments,
        monthlyHours,
        totalClients,
      });

      setUpcomingAppointments(appointments.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dashboard...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Benvenuto! Ecco il riepilogo della tua attività
        </p>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Appuntamenti Oggi</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.todayAppointments}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Prossimi 7 Giorni</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.weekAppointments}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Ore Mese Corrente</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.monthlyHours.toFixed(1)}h
              </p>
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {(() => {
                    const progressValue = Math.min(Math.round((stats.monthlyHours / 1500) * 100), 100);
                    const progressWidth = Math.min((stats.monthlyHours / 1500) * 100, 100);
                    return (
                      <div
                        className={`h-2 rounded-full ${
                          stats.monthlyHours > 1500
                            ? 'bg-red-600'
                            : stats.monthlyHours > 1200
                            ? 'bg-yellow-500'
                            : 'bg-green-600'
                        }`}
                        role="progressbar"
                        aria-label={`Ore mese corrente: ${stats.monthlyHours.toFixed(1)}h`}
                        aria-valuenow={String(progressValue)}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((stats.monthlyHours / 1500) * 100).toFixed(0)}% capacità
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Clienti Totali</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {stats.totalClients}
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Prossimi Appuntamenti</h2>
              <Link href="/dashboard/appointments">
                <Button variant="secondary" size="sm">
                  Vedi Tutti
                </Button>
              </Link>
            </div>

            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Nessun appuntamento in programma
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {appointment.client.firstName} {appointment.client.lastName}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.type}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(appointment.startTime), 'dd/MM/yyyy HH:mm')} •{' '}
                          {appointment.duration}h
                        </p>
                      </div>
                      <Link href={`/dashboard/appointments/${appointment.id}`}>
                        <Button variant="secondary" size="sm">
                          Dettagli
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Azioni Rapide</h2>
            <div className="space-y-3">
              <Link href="/dashboard/appointments/new">
                <Button variant="primary" className="w-full">
                  📅 Nuovo Appuntamento
                </Button>
              </Link>
              <Link href="/dashboard/clients/new">
                <Button variant="secondary" className="w-full">
                  👤 Nuovo Cliente
                </Button>
              </Link>
              <Link href="/dashboard/backlog">
                <Button variant="secondary" className="w-full">
                  📊 Backlog Ore
                </Button>
              </Link>
              <Link href="/dashboard/clients">
                <Button variant="secondary" className="w-full">
                  📋 Gestione Clienti
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
