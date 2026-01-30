'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import ClientForm from '@/components/clients/ClientForm';
import DocumentUpload from '@/components/clients/DocumentUpload';
import { useAuthStore } from '@/store/authStore';

interface ClientDocument {
  id: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  notes?: string;
  uploadedAt: string;
}

interface ClientStatistics {
  totalAppointments: number;
  completedAppointments: number;
  totalHours: number;
  lastAppointmentDate: string | null;
}

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: Date | string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  taxCode?: string;
  notes?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  companyName?: string;
  coworkers?: CoworkerRelationship[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface CoworkerRelationship {
  id: string;
  isPrimary?: boolean;
  coworker?: {
    id: string;
    user?: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [statistics, setStatistics] = useState<ClientStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { token } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://eqb-coworker-platform.onrender.com';

  const fetchClientData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch client details
      const clientResponse = await fetch(`${apiUrl}/api/clients/${clientId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!clientResponse.ok) {
        throw new Error('Cliente non trovato');
      }

      const clientData = await clientResponse.json();
      setClient(clientData.data);

      // Fetch documents
      const docsResponse = await fetch(`${apiUrl}/api/clients/${clientId}/documents`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        setDocuments(docsData.data);
      }

      // Fetch statistics
      const statsResponse = await fetch(
        `${apiUrl}/api/clients/${clientId}/statistics`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.data);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
    }
  }, [clientId, fetchClientData]);

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo documento?')) {
      return;
    }

    try {
      const response = await fetch(
        `${apiUrl}/api/clients/${clientId}/documents/${documentId}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del documento');
      }

      fetchClientData(); // Refresh data
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  const handleDeleteClient = async () => {
    if (
      !confirm(
        'Sei sicuro di voler eliminare questo cliente? Questa azione non può essere annullata.'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error('Errore nell\'eliminazione del cliente');
      }

      router.push('/dashboard/clients');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert type="error" message={error || 'Cliente non trovato'} />
        <Link href="/dashboard/clients">
          <Button variant="secondary" className="mt-4">
            Torna ai Clienti
          </Button>
        </Link>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Modifica Cliente</h1>
          <p className="mt-2 text-gray-600">
            Aggiorna le informazioni del cliente
          </p>
        </div>

        <ClientForm initialData={client} clientId={clientId} />

        <div className="mt-4">
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            Annulla Modifica
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>
              <Badge
                variant={client.status === 'ACTIVE' ? 'success' : 'warning'}
              >
                {client.status}
              </Badge>
            </div>
            <Link href="/dashboard/clients">
              <span className="text-blue-600 hover:text-blue-800">
                ← Torna ai Clienti
              </span>
            </Link>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              Modifica
            </Button>
            <Button variant="danger" onClick={handleDeleteClient}>
              Elimina
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Appuntamenti Totali</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statistics.totalAppointments}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Completati</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {statistics.completedAppointments}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Ore Totali</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {statistics.totalHours}h
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-sm text-gray-600">Ultimo Appuntamento</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {statistics.lastAppointmentDate
                  ? new Date(statistics.lastAppointmentDate).toLocaleDateString(
                      'it-IT'
                    )
                  : 'N/A'}
              </p>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Informazioni Personali
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.email && (
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-gray-900">{client.email}</p>
                  </div>
                )}
                {client.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefono</p>
                    <p className="text-gray-900">{client.phone}</p>
                  </div>
                )}
                {client.birthDate && (
                  <div>
                    <p className="text-sm text-gray-600">Data di Nascita</p>
                    <p className="text-gray-900">
                      {new Date(client.birthDate).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                )}
                {client.taxCode && (
                  <div>
                    <p className="text-sm text-gray-600">Codice Fiscale</p>
                    <p className="text-gray-900">{client.taxCode}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {client.address && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Indirizzo</h2>
                <p className="text-gray-900">{client.address}</p>
                {(client.city || client.province || client.postalCode) && (
                  <p className="text-gray-900 mt-1">
                    {client.city}
                    {client.province && ` (${client.province})`}
                    {client.postalCode && ` - ${client.postalCode}`}
                  </p>
                )}
              </div>
            </Card>
          )}

          {client.notes && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Note</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            </Card>
          )}

          {/* Documents Section */}
          <Card>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Documenti</h2>
              {documents.length === 0 ? (
                <p className="text-gray-500">Nessun documento caricato</p>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {doc.fileName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {doc.documentType} •{' '}
                          {(doc.fileSize / 1024).toFixed(2)} KB •{' '}
                          {new Date(doc.uploadedAt).toLocaleDateString('it-IT')}
                        </p>
                        {doc.notes && (
                          <p className="text-sm text-gray-500 mt-1">
                            {doc.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="secondary" size="sm">
                            Scarica
                          </Button>
                        </a>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Elimina
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Coworkers */}
          {client.coworkers && client.coworkers.length > 0 && (
            <Card>
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">Operatori</h2>
                <div className="space-y-3">
                  {client.coworkers.map((rel: CoworkerRelationship) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {rel.coworker?.user?.firstName}{' '}
                          {rel.coworker?.user?.lastName}
                        </p>
                        {rel.isPrimary && (
                          <Badge variant="success" className="mt-1">
                            Primario
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Document Upload */}
          <DocumentUpload clientId={clientId} onUploadSuccess={fetchClientData} />
        </div>
      </div>
    </div>
  );
}
