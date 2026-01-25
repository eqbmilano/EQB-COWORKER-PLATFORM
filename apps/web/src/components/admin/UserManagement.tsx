'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'ADMIN' | 'OPERATOR';
  status: 'ACTIVE' | 'INACTIVE';
  coworker?: {
    id: string;
    specialization?: string;
    hourlyRate: number;
  };
  createdAt: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/users?includeInactive=${includeInactive}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  useEffect(() => {
    fetchUsers();
  }, [includeInactive, fetchUsers]);

  const handleActivateUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/activate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to activate user');
      }

      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm('Sei sicuro di voler disattivare questo utente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate user');
      }

      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        'ATTENZIONE: Questa azione eliminerà permanentemente l\'utente. Sei sicuro?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }

      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  const handleChangeRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'OPERATOR' : 'ADMIN';

    if (
      !confirm(
        `Vuoi cambiare il ruolo di questo utente a ${newRole}?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}/change-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to change role');
      }

      fetchUsers();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento utenti...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error" message={error} />}

      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">
            Gestione Utenti ({users.length})
          </h2>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="rounded border-gray-300"
            />
            Mostra inattivi
          </label>
        </div>
        <a href="/dashboard/admin/users/new">
          <Button variant="primary">+ Nuovo Utente</Button>
        </a>
      </div>

      {/* Users Grid */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id}>
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h3>
                    <Badge
                      variant={
                        user.role === 'ADMIN' ? 'success' : 'default'
                      }
                    >
                      {user.role}
                    </Badge>
                    <Badge
                      variant={
                        user.status === 'ACTIVE' ? 'success' : 'warning'
                      }
                    >
                      {user.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Email:</span>
                      <span>{user.email}</span>
                    </div>
                    {user.phoneNumber && (
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Telefono:</span>
                        <span>{user.phoneNumber}</span>
                      </div>
                    )}
                    {user.coworker && (
                      <>
                        {user.coworker.specialization && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Specializzazione:</span>
                            <span>{user.coworker.specialization}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Tariffa oraria:</span>
                          <span>€{user.coworker.hourlyRate}/h</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Creato il:</span>
                      <span>
                        {new Date(user.createdAt).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <a href={`/dashboard/admin/users/${user.id}`}>
                    <Button variant="secondary" size="sm">
                      Modifica
                    </Button>
                  </a>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleChangeRole(user.id, user.role)}
                  >
                    Cambia Ruolo
                  </Button>
                  {user.status === 'ACTIVE' ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeactivateUser(user.id)}
                    >
                      Disattiva
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleActivateUser(user.id)}
                    >
                      Attiva
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    Elimina
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <p className="text-gray-500 text-lg">Nessun utente trovato</p>
          </div>
        </Card>
      )}
    </div>
  );
}
