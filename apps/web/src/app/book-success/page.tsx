'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function BookingSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4">
      <Card className="w-full max-w-md p-8 text-center bg-white shadow-lg">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Prenotazione Inviata!</h1>
        
        <p className="text-gray-600 mb-6">
          La tua richiesta di prenotazione è stata ricevuta con successo. Riceverai una email di 
          conferma entro 24 ore.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">ℹ️ Prossimo passo:</span>
            <br />
            Il nostro team esaminerà la tua richiesta e ti contatterà per confermare l'appuntamento.
          </p>
        </div>

        <Link href="/">
          <Button variant="primary" className="w-full">
            Torna alla Home
          </Button>
        </Link>
      </Card>
    </div>
  );
}
