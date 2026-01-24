/**
 * Invoices Page (MVP Placeholder)
 */
'use client';

import { FileText, Plus } from 'lucide-react';

export default function InvoicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Fatture</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition">
          <Plus className="w-5 h-5" />
          Nuova Fattura
        </button>
      </div>

      <div className="text-center py-16 bg-white/10 backdrop-blur border border-white/20 rounded-lg">
        <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-50 mb-2">Modulo Fatture</h2>
        <p className="text-slate-300 mb-6">
          Generazione, esportazione PDF, tracking pagamenti<br />
          <span className="text-sm text-slate-400">(In sviluppo)</span>
        </p>
        <div className="space-y-2 text-sm text-slate-400">
          <p>✓ Generazione fatture</p>
          <p>✓ Esportazione PDF</p>
          <p>✓ Tracking pagamenti</p>
          <p>✓ Integrazione pagamenti opzionale</p>
        </div>
      </div>
    </div>
  );
}
