"use client";

import { format } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface BacklogEntry {
  id: string;
  date: string;
  hoursWorked: number;
  appointmentsCompleted: number;
  coworker: {
    id: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
}

interface BacklogEntriesListProps {
  startDate: string;
  endDate: string;
}

export default function BacklogEntriesList({ startDate, endDate }: BacklogEntriesListProps) {
  const [entries, setEntries] = useState<BacklogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eqb-coworker-platform.onrender.com";

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${apiUrl}/api/backlog/entries?startDate=${startDate}&endDate=${endDate}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );

      if (response.ok) {
        const data = await response.json();
        setEntries(data.data);
      }
    } catch (error) {
      console.error("Error fetching backlog entries:", error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchEntries();
  }, [startDate, endDate, fetchEntries]);

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">
          Nessuna entry trovata per il periodo selezionato
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          Dettaglio Ore Lavorate ({entries.length} giorni)
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operatore
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ore Lavorate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appuntamenti
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {format(new Date(entry.date), "dd/MM/yyyy")}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {entry.coworker.user.firstName} {entry.coworker.user.lastName}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {entry.hoursWorked.toFixed(1)}h
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                    {entry.appointmentsCompleted}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
