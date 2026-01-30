/**
 * Invoices Page
 * Gestione completa fatture con CRUD e PDF export
 */
'use client';

import { useEffect, useState } from 'react';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  Download,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { useInvoices, Invoice, CreateInvoiceInput } from '@/hooks/useInvoices';
import { useAppointments } from '@/hooks/useAppointments';
import { formatDate } from 'date-fns';
import { it } from 'date-fns/locale';

type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';

const statusConfig: Record<InvoiceStatus, { color: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
  DRAFT: { color: 'bg-slate-500', icon: Clock, label: 'Bozza' },
  SENT: { color: 'bg-blue-500', icon: CheckCircle, label: 'Inviata' },
  PAID: { color: 'bg-green-500', icon: CheckCircle, label: 'Pagata' },
  OVERDUE: { color: 'bg-red-500', icon: AlertCircle, label: 'Scaduta' },
  CANCELLED: { color: 'bg-slate-600', icon: XCircle, label: 'Annullata' },
};

export default function InvoicesPage() {
  const { invoices, loading, error, fetchInvoices, createInvoice, updateInvoice, deleteInvoice, downloadPDF } =
    useInvoices();
  const { appointments } = useAppointments();

  const [showForm, setShowForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [formData, setFormData] = useState<CreateInvoiceInput>({
    appointmentId: '',
    amount: 0,
    currency: 'EUR',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'DRAFT',
  });

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedInvoice) {
        await updateInvoice(selectedInvoice.id, {
          amount: formData.amount,
          issueDate: formData.issueDate,
          dueDate: formData.dueDate,
          status: formData.status,
        });
      } else {
        await createInvoice(formData);
      }
      setShowForm(false);
      setSelectedInvoice(null);
      setFormData({
        appointmentId: '',
        amount: 0,
        currency: 'EUR',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'DRAFT',
      });
      await fetchInvoices();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleEdit = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      appointmentId: invoice.appointmentId,
      amount: invoice.amount,
      currency: invoice.currency,
      issueDate: invoice.issueDate.split('T')[0],
      dueDate: invoice.dueDate.split('T')[0],
      status: invoice.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa fattura?')) {
      await deleteInvoice(id);
      await fetchInvoices();
    }
  };

  const handleDownloadPDF = async (id: string) => {
    try {
      await downloadPDF(id);
    } catch (err) {
      console.error('Error downloading PDF:', err);
    }
  };

  const getTotalAmount = () => invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const getPaidAmount = () => invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Fatture</h1>
        <button
          onClick={() => {
            setSelectedInvoice(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nuova Fattura
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-indigo-400" />
            <div>
              <p className="text-slate-300 text-sm">Totale Fatture</p>
              <p className="text-2xl font-bold text-slate-50">€{getTotalAmount().toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400" />
            <div>
              <p className="text-slate-300 text-sm">Incassato</p>
              <p className="text-2xl font-bold text-slate-50">€{getPaidAmount().toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-400" />
            <div>
              <p className="text-slate-300 text-sm">Numero Fatture</p>
              <p className="text-2xl font-bold text-slate-50">{invoices.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-white/20 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold text-slate-50 mb-6">
              {selectedInvoice ? 'Modifica Fattura' : 'Nuova Fattura'}
            </h2>
            <form onSubmit={handleCreateOrUpdate} className="space-y-4">
              {/* Appointment Select */}
              <div>
                <label htmlFor="appointmentId" className="block text-sm font-medium text-slate-300 mb-2">Appuntamento *</label>
                <select
                  id="appointmentId"
                  value={formData.appointmentId}
                  onChange={(e) => setFormData({ ...formData, appointmentId: e.target.value })}
                  disabled={!!selectedInvoice}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-slate-50 disabled:opacity-50"
                  required
                >
                  <option value="">Seleziona appuntamento</option>
                  {appointments.map((apt) => (
                    <option key={apt.id} value={apt.id}>
                      {apt.clientName} - {formatDate(new Date(apt.startTime), 'PPP', { locale: it })}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-slate-300 mb-2">Importo (€) *</label>
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-slate-50"
                  required
                />
              </div>

              {/* Issue Date */}
              <div>
                <label htmlFor="issueDate" className="block text-sm font-medium text-slate-300 mb-2">Data Emissione *</label>
                <input
                  id="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-slate-50"
                  required
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="block text-sm font-medium text-slate-300 mb-2">Data Scadenza *</label>
                <input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-slate-50"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-300 mb-2">Stato</label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-white/20 rounded-lg text-slate-50"
                >
                  <option value="DRAFT">Bozza</option>
                  <option value="SENT">Inviata</option>
                  <option value="PAID">Pagata</option>
                  <option value="OVERDUE">Scaduta</option>
                  <option value="CANCELLED">Annullata</option>
                </select>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
                >
                  {selectedInvoice ? 'Aggiorna' : 'Crea'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedInvoice(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Annulla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoices List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-slate-400">Caricamento fatture...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-12 bg-white/10 backdrop-blur border border-white/20 rounded-lg">
          <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-300">Nessuna fattura trovata</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => {
            const StatusIcon = statusConfig[invoice.status as InvoiceStatus]?.icon || FileText;
            const statusColor = statusConfig[invoice.status as InvoiceStatus]?.color || 'bg-slate-500';
            const statusLabel = statusConfig[invoice.status as InvoiceStatus]?.label || invoice.status;

            return (
              <div
                key={invoice.id}
                className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 flex items-center justify-between hover:bg-white/15 transition"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`${statusColor} p-3 rounded-lg`}>
                    <StatusIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-50">{invoice.appointmentClientName}</p>
                    <div className="flex gap-4 text-sm text-slate-400">
                      <span>€{invoice.amount.toFixed(2)}</span>
                      <span>{statusLabel}</span>
                      <span>Scadenza: {formatDate(new Date(invoice.dueDate), 'PPP', { locale: it })}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg transition"
                    title="Scarica PDF"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleEdit(invoice)}
                    className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg transition"
                    title="Modifica"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(invoice.id)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition"
                    title="Elimina"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
