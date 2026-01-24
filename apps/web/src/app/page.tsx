'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo/Icon */}
        <div>
          <div className="mx-auto h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-4xl">🚀</span>
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            EQB Platform
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Gestione Appuntamenti e Fatture
          </p>
        </div>

        {/* Features */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-3 text-left">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <h3 className="font-semibold text-gray-900">Appuntamenti</h3>
              <p className="text-sm text-gray-600">Prenota e gestisci i tuoi appuntamenti</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">👥</span>
            <div>
              <h3 className="font-semibold text-gray-900">Clienti</h3>
              <p className="text-sm text-gray-600">Profili e storico completi</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-2xl">💼</span>
            <div>
              <h3 className="font-semibold text-gray-900">Fatturazione</h3>
              <p className="text-sm text-gray-600">Gestione automatica delle fatture</p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-4">
          <Button 
            href="/login"
            className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            Accedi
          </Button>
          
          <Button
            href="/signup"
            variant="outline"
            className="w-full py-4 text-lg font-semibold border-2 border-gray-300 hover:border-gray-400 text-gray-700 transition-all"
          >
            Registrati
          </Button>
        </div>

        {/* Footer */}
        <p className="text-sm text-gray-500 pt-4">
          Ottimizzato per dispositivi mobili 📱
        </p>
      </div>
    </main>
  );
}
