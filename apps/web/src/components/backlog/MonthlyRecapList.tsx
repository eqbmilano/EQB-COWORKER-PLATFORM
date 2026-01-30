"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface MonthlyRecap {
  month: string;
  year: number;
  totalHours: number;
  totalAppointments: number;
  dailyAverage: number;
  capacityUsed: number;
}

export default function MonthlyRecapList() {
  const [recaps, setRecaps] = useState<MonthlyRecap[]>([]);
  const [loading, setLoading] = useState(true);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eqb-coworker-platform.onrender.com";
  const { token } = useAuthStore();

  useEffect(() => {
    fetchMonthlyRecaps();
  }, []);

  const fetchMonthlyRecaps = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${apiUrl}/api/backlog/monthly-recap`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (response.ok) {
        const data = await response.json();
        setRecaps(data.data);
      }
    } catch (error) {
      console.error("Error fetching monthly recaps:", error);
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

  if (recaps.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-gray-500">Nessun riepilogo mensile disponibile</div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Riepilogo Mensile</h3>
        <div className="space-y-4">
          {recaps.map((recap, index) => (
            <div
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">
                    {recap.month} {recap.year}
                  </h4>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    recap.capacityUsed > 100
                      ? "bg-red-100 text-red-800"
                      : recap.capacityUsed > 80
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {recap.capacityUsed.toFixed(1)}%
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Ore Totali</p>
                  <p className="text-lg font-bold text-blue-600">{recap.totalHours.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Appuntamenti</p>
                  <p className="text-lg font-bold text-green-600">{recap.totalAppointments}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Media Giornaliera</p>
                  <p className="text-lg font-bold text-purple-600">
                    {recap.dailyAverage.toFixed(1)}h
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  {(() => {
                    const progressValue = Math.min(Math.round(recap.capacityUsed), 100);
                    const progressWidth = Math.min(recap.capacityUsed, 100);
                    return (
                      <div
                        className={`h-2 rounded-full ${
                          recap.capacityUsed > 100
                            ? "bg-red-600"
                            : recap.capacityUsed > 80
                              ? "bg-yellow-500"
                              : "bg-green-600"
                        }`}
                        role="progressbar"
                        aria-label={`Capacit\u00e0: ${recap.capacityUsed.toFixed(0)}%`}
                        aria-valuenow={progressValue}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        style={{ width: `${progressWidth}%` }}
                      ></div>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
