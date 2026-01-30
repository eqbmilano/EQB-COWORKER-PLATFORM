"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

interface DocumentUploadProps {
  clientId: string;
  onUploadSuccess?: () => void;
}

interface DocumentType {
  value: string;
  label: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  { value: "identity_card", label: "Carta d'Identità" },
  { value: "tax_code", label: "Codice Fiscale" },
  { value: "medical_certificate", label: "Certificato Medico" },
  { value: "consent_form", label: "Consenso Informato" },
  { value: "contract", label: "Contratto" },
  { value: "invoice", label: "Fattura" },
  { value: "other", label: "Altro" },
];

export default function DocumentUpload({ clientId, onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { token } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://eqb-coworker-platform.onrender.com";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("Il file non può superare i 10MB");
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError("Seleziona un file da caricare");
      return;
    }

    if (!documentType) {
      setError("Seleziona il tipo di documento");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("documentType", documentType);
      if (notes) {
        formData.append("notes", notes);
      }

      const response = await fetch(`${apiUrl}/api/clients/${clientId}/documents`, {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Errore nel caricamento del documento");
      }

      setSuccess(true);
      setFile(null);
      setDocumentType("");
      setNotes("");

      // Reset file input
      const fileInput = document.getElementById("file-upload") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Errore sconosciuto";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Carica Documento</h3>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message="Documento caricato con successo!" />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo di Documento <span className="text-red-500">*</span>
            </label>
            <select
              id="documentType"
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Seleziona tipo...</option>
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              id="file-upload"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Formati supportati: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX (max 10MB)
            </p>
            {file && (
              <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">File selezionato:</span> {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  Dimensione: {(file.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Note sul documento..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Caricamento..." : "Carica Documento"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
