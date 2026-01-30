"use client";

import { endOfMonth, format, startOfMonth } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface BacklogStatistics {
  totalHours: number;
  completedAppointments: number;
  averageHoursPerDay: number;
  remainingCapacity: number;
}

interface CapacityData {
  totalCapacity: number;
  usedHours: number;
  remainingHours: number;
  capacityUsedPercentage: number;
  isOverCapacity: boolean;
}

export default function BacklogDashboard() {
  const [statistics, setStatistics] = useState<BacklogStatistics | null>(null);
  const [capacity, setCapacity] = useState<CapacityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eqb-coworker-platform.onrender.com";
  const { token } = useAuthStore();

  const fetchBacklogData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch statistics
      const statsResponse = await fetch(
        `${apiUrl}/api/backlog/statistics?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.data);
      } else {
        setError("Impossibile caricare le statistiche del backlog");
      }

      // Fetch capacity
      const capacityResponse = await fetch(`${apiUrl}/api/backlog/capacity`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (capacityResponse.ok) {
        const capacityData = await capacityResponse.json();
        setCapacity(capacityData.data);
      } else {
        setError("Impossibile caricare la capacità del backlog");
      }
    } catch (error) {
      setError("Errore nel caricamento dei dati del backlog");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchBacklogData();
  }, [startDate, endDate, fetchBacklogData]);

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento dati backlog...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}
      {/* Date Range Filter */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Filtro Periodo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data Inizio
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Data Fine
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Capacity Card */}
      {capacity && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Capacità Mensile</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Ore Utilizzate</span>
                  <span className="text-sm font-medium text-gray-900">
                    {capacity.usedHours.toFixed(1)}h / {capacity.totalCapacity}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  {(() => {
                    const progressValue = Math.min(
                      Math.round(capacity.capacityUsedPercentage),
                      100,
                    );
                    const progressWidth = Math.min(capacity.capacityUsedPercentage, 100);
                    // biome-ignore lint/security/noInlineStyles: Dynamic width requires inline styles
                    // biome-ignore lint/a11y/ariaUnsupportedElementAttributes: aria-valuenow must be dynamic
                    // eslint-disable-next-line @next/next/no-html-link-for-pages, jsx-a11y/aria-unsupported-elements
                    return (
                      // @ts-ignore - inline style is necessary for dynamic width
                      <div
                        className={`h-4 rounded-full transition-all ${
                          capacity.isOverCapacity
                            ? "bg-red-600"
                            : capacity.capacityUsedPercentage > 80
                              ? "bg-yellow-500"
                              : "bg-green-600"
                        }`}
                        role="progressbar"
                        aria-label="Capacità utilizzata"
                        aria-valuenow={progressValue.toString()}
                        aria-valuemin="0"
                        aria-valuemax="100"
                        style={{
                          width: `${progressWidth}%`,
                        }}
                      ></div>
                    );
                  })()}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {capacity.capacityUsedPercentage.toFixed(1)}% utilizzato
                  </span>
                  {capacity.isOverCapacity && (
                    <span className="text-xs text-red-600 font-semibold">⚠️ Capacità superata</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-600">Ore Rimanenti</p>
                  <p className="text-2xl font-bold text-green-600">
                    {capacity.remainingHours.toFixed(1)}h
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Ore Utilizzate</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {capacity.usedHours.toFixed(1)}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Ore Totali</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {statistics.totalHours.toFixed(1)}h
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Appuntamenti Completati</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {statistics.completedAppointments}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-6">
              <p className="text-sm text-gray-600">Media Ore/Giorno</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {statistics.averageHoursPerDay.toFixed(1)}h
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
