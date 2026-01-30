'use client';

import BacklogDashboard from '@/components/backlog/BacklogDashboard';
import MonthlyRecapList from '@/components/backlog/MonthlyRecapList';

export default function BacklogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-50">Backlog</h1>
        <p className="mt-2 text-slate-300">Statistiche e riepiloghi delle ore</p>
      </div>

      <BacklogDashboard />
      <MonthlyRecapList />
    </div>
  );
}
