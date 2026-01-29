/**
 * Clients List Page
 */
'use client';

import { useState, useEffect } from 'react';
import { useClients } from '@/hooks/useClients';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { Users, Plus, Trash2, Edit, AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';

export default function ClientsPage() {
  const { clients, loading, error, fetchClients, deleteClient, clearError } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClients(searchTerm);
  }, [searchTerm, fetchClients]);

  const handleDelete = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questo cliente?')) {
      await deleteClient(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-50">Clienti</h1>
        <button
          onClick={() => {
            setEditingId(null);
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Nuovo Cliente
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-medium">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-200 hover:text-red-100 mt-1"
            >
              Chiudi
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <ClientForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            fetchClients();
          }}
          editingId={editingId}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Cerca clienti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Clients Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-slate-300">Caricamento clienti...</p>
          </div>
        ) : clients.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white/5 border border-white/10 rounded-lg">
            <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-300">Nessun cliente ancora</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
            >
              Crea il primo cliente
            </button>
          </div>
        ) : (
          clients.map((client) => (
            <div
              key={client.id}
              className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-4 hover:bg-white/15 transition"
            >
              <div className="space-y-3">
                <div>
                  <Link
                    href={`/clients/${client.id}`}
                    className="text-lg font-bold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    {client.name}
                  </Link>
                  {client.companyName && (
                    <p className="text-sm text-slate-400">{client.companyName}</p>
                  )}
                </div>

                {client.email && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-400">Email:</span> {client.email}
                  </p>
                )}

                {client.phone && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-400">Tel:</span> {client.phone}
                  </p>
                )}

                {client.city && (
                  <p className="text-sm text-slate-300">
                    <span className="text-slate-400">Città:</span> {client.city}
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  Aggiunto il {format(parseISO(client.createdAt), 'dd MMM yyyy', { locale: it })}
                </p>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingId(client.id);
                      setShowForm(true);
                    }}
                    className="flex-1 px-3 py-1.5 hover:bg-blue-500/20 rounded-lg transition text-blue-400 hover:text-blue-300 text-sm flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Modifica
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="flex-1 px-3 py-1.5 hover:bg-red-500/20 rounded-lg transition text-red-400 hover:text-red-300 text-sm flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

interface ClientFormProps {
  onClose: () => void;
  onSuccess: () => void;
  editingId: string | null;
}

function ClientForm({ onClose, onSuccess, editingId }: ClientFormProps) {
  const { createClient, updateClient, loading, error: hookError, clearError } = useClients();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    address: '',
    city: '',
    zipCode: '',
    notes: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Il nome del cliente è obbligatorio');
      return;
    }

    try {
      const clientData: CreateClientInput = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        companyName: formData.companyName || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        zipCode: formData.zipCode || undefined,
        notes: formData.notes || undefined,
      };

      if (editingId) {
        await updateClient(editingId, clientData);
        setSuccess('Cliente aggiornato con successo!');
      } else {
        await createClient(clientData);
        setSuccess('Cliente creato con successo!');
      }

      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Errore nel salvataggio';
      setError(message);
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur border border-white/20 rounded-lg p-6 space-y-4">
      <h3 className="text-xl font-bold text-slate-50">{editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}</h3>

      {(error || hookError) && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-300 text-sm">{error || hookError}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
          <p className="text-green-300 text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nome Cliente *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nome"
              required
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>

          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+39 123 456 7890"
              disabled={loading}
            />
          </div>

          {/* Azienda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Azienda
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Nome Azienda"
              disabled={loading}
            />
          </div>

          {/* Indirizzo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Indirizzo
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Via..."
              disabled={loading}
            />
          </div>

          {/* Città */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Città
            </label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Città"
              disabled={loading}
            />
          </div>

          {/* CAP */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              CAP
            </label>
            <input
              type="text"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="00000"
              disabled={loading}
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Note
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Note aggiuntive..."
            rows={3}
            disabled={loading}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 text-white rounded-lg transition font-medium"
          >
            {loading ? 'Salvataggio...' : 'Salva Cliente'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:bg-slate-700 text-slate-300 rounded-lg transition"
          >
            Annulla
          </button>
        </div>
      </form>
    </div>
  );
}
