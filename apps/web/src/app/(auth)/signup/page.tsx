/**
 * Signup Page - Auth0 Integration
 */
'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function SignupPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleSignup = () => {
    loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      },
      appState: {
        returnTo: '/dashboard',
      },
    });
  };

  if (isLoading) {
    return (
      <Card className="p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 sm:p-10 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Registrati</h1>
        <p className="text-gray-600 mt-2">Crea il tuo account EQB Platform</p>
      </div>

      {/* Signup Button */}
      <div className="space-y-4">
        <Button
          onClick={handleSignup}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          disabled={isLoading}
        >
          Registrati con Auth0
        </Button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            🔒 Registrazione sicura tramite Auth0
          </p>
        </div>

        {/* Features */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="text-xs font-semibold text-gray-700 mb-2">✨ Con EQB Platform puoi:</p>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>📅 Gestire i tuoi appuntamenti</li>
            <li>👥 Organizzare i profili clienti</li>
            <li>💼 Creare e gestire fatture</li>
            <li>📊 Visualizzare statistiche e report</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-600">
          Hai già un account?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Accedi
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-4">
          <Link href="/" className="hover:text-gray-700">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </Card>
  );
}
