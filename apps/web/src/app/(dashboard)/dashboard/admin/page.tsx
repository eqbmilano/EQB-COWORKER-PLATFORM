'use client';

import { useEffect, useState } from 'react';
import { useAdmin, CreateUserData } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { 
  Users, 
  Plus, 
  Shield, 
  UserCheck, 
  UserX, 
  Crown,
  Mail,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export default function AdminPage() {
  const { users, loading, error, fetchUsers, createUser, updateUserRole, updateUserStatus } = useAdmin();
  const { isAdmin } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'COWORKER',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers(includeInactive);
    }
  }, [isAdmin, fetchUsers, includeInactive]);

  if (!isAdmin) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card variant="solid" className="max-w-md p-8 text-center">
          <Shield className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h2 className="mb-2 text-2xl font-semibold text-white">Accesso Negato</h2>
          <p className="text-slate-300">Solo gli amministratori possono accedere a questa pagina.</p>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      await createUser(formData);
      setShowCreateForm(false);
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'COWORKER',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Errore durante la creazione');
    } finally {
      setFormLoading(false);
    }
  };

  const handlePromote = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'ADMIN' ? 'COWORKER' : 'ADMIN';
      await updateUserRole(userId, newRole);
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await updateUserStatus(userId, newStatus);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === 'ADMIN') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-3 py-1 text-sm font-medium text-indigo-300">
          <Crown className="h-3 w-3" />
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-700/50 px-3 py-1 text-sm font-medium text-slate-300">
        <UserCheck className="h-3 w-3" />
        Coworker
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-sm text-green-400">
            <CheckCircle className="h-4 w-4" />
            Attivo
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 text-sm text-slate-500">
            <XCircle className="h-4 w-4" />
            Inattivo
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" />
            Sospeso
          </span>
        );
      default:
        return null;
    }
  };

  const activeUsers = users.filter(u => u.status === 'ACTIVE');
  const adminCount = activeUsers.filter(u => u.role === 'ADMIN').length;
  const coworkerCount = activeUsers.filter(u => u.role === 'COWORKER').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestione Utenti</h1>
        <p className="mt-2 text-slate-400">Amministra utenti e ruoli della piattaforma</p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Totale Utenti</p>
              <p className="mt-1 text-3xl font-bold text-white">{activeUsers.length}</p>
            </div>
            <Users className="h-12 w-12 text-indigo-400" />
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Amministratori</p>
              <p className="mt-1 text-3xl font-bold text-white">{adminCount}</p>
            </div>
            <Crown className="h-12 w-12 text-indigo-400" />
          </div>
        </Card>

        <Card variant="glass">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Coworker</p>
              <p className="mt-1 text-3xl font-bold text-white">{coworkerCount}</p>
            </div>
            <UserCheck className="h-12 w-12 text-indigo-400" />
          </div>
        </Card>
      </div>

      {/* Actions */}
      <Card variant="glass">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
              />
              Mostra inattivi
            </label>
          </div>
          
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Nuovo Utente
          </button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card variant="solid" className="border-red-500/50 bg-red-950/30">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card variant="glass">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Crea Nuovo Utente</h3>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError(null);
                }}
                className="text-slate-400 transition-colors hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="rounded-lg border border-red-500/50 bg-red-950/30 p-3 text-sm text-red-400">
                {formError}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Nome</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Cognome</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  required
                  minLength={8}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-300">Ruolo</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'ADMIN' | 'COWORKER' }))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800/50 px-4 py-2 text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="COWORKER">Coworker</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setFormError(null);
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {formLoading ? 'Creazione...' : 'Crea Utente'}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Users List */}
      <Card variant="glass">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">Utenti ({users.length})</h3>

          {loading ? (
            <p className="py-8 text-center text-slate-400">Caricamento...</p>
          ) : users.length === 0 ? (
            <p className="py-8 text-center text-slate-400">Nessun utente trovato</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-4 rounded-lg border border-slate-700 bg-slate-800/30 p-4 transition-colors hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-white">
                        {user.firstName} {user.lastName}
                      </h4>
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>

                    {user.coworkerProfile && (
                      <div className="text-sm text-slate-500">
                        {user.coworkerProfile.profession} • {user.coworkerProfile.specialization}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePromote(user.id, user.role)}
                      className="inline-flex items-center gap-1 rounded-lg border border-indigo-600 px-3 py-1.5 text-sm font-medium text-indigo-400 transition-colors hover:bg-indigo-600 hover:text-white"
                    >
                      <Shield className="h-4 w-4" />
                      {user.role === 'ADMIN' ? 'Rimuovi Admin' : 'Promuovi'}
                    </button>

                    <button
                      onClick={() => handleToggleStatus(user.id, user.status)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                        user.status === 'ACTIVE'
                          ? 'border-red-600 text-red-400 hover:bg-red-600 hover:text-white'
                          : 'border-green-600 text-green-400 hover:bg-green-600 hover:text-white'
                      }`}
                    >
                      {user.status === 'ACTIVE' ? (
                        <>
                          <UserX className="h-4 w-4" />
                          Disattiva
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Attiva
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
