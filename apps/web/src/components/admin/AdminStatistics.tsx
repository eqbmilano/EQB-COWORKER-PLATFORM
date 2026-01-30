"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface SystemStatistics {
  totalUsers: number;
  activeUsers: number;
  totalCoworkers: number;
  totalClients: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  totalHoursWorked: number;
  monthlyHoursWorked: number;
}

export default function AdminStatistics() {
  const [statistics, setStatistics] = useState<SystemStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eqb-coworker-platform.onrender.com";
  const { token } = useAuthStore();

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/api/admin/statistics`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data.data);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (!statistics) {
    return null;
  }

  const completionRate =
    statistics.totalAppointments > 0
      ? (statistics.completedAppointments / statistics.totalAppointments) * 100
      : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Statistiche Sistema</h2>

      {/* Main Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Utenti Totali</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{statistics.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">{statistics.activeUsers} attivi</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Operatori</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{statistics.totalCoworkers}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Clienti</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{statistics.totalClients}</p>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <p className="text-sm text-gray-600">Appuntamenti Totali</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {statistics.totalAppointments}
            </p>
          </div>
        </Card>
      </div>

      {/* Appointments Statistics */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Appuntamenti</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Completati</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {statistics.completedAppointments}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">In Attesa</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {statistics.pendingAppointments}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tasso di Completamento</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Hours Statistics */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ore Lavorate</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Totali (storico)</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {statistics.totalHoursWorked.toFixed(1)}h
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Mese Corrente</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statistics.monthlyHoursWorked.toFixed(1)}h
              </p>
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-3">
                  {(() => {
                    const progressValue = Math.min(
                      Math.round((statistics.monthlyHoursWorked / 1500) * 100),
                      100,
                    );
                    const progressWidth = Math.min(
                      (statistics.monthlyHoursWorked / 1500) * 100,
                      100,
                    );
                    return (
                      <div
                        className={`h-3 rounded-full ${
                          statistics.monthlyHoursWorked > 1500
                            ? "bg-red-600"
                            : statistics.monthlyHoursWorked > 1200
                              ? "bg-yellow-500"
                              : "bg-green-600"
                        }`}
                        role="progressbar"
                        aria-label={`Ore mese corrente: ${statistics.monthlyHoursWorked.toFixed(1)}h`}
                        aria-valuenow={progressValue}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    );
                  })()}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {((statistics.monthlyHoursWorked / 1500) * 100).toFixed(1)}% della capacità
                  mensile (1,500h)
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
