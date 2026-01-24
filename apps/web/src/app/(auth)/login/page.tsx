/**
 * Login Page - Auth0 Integration
 */
'use client';

import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = () => {
    loginWithRedirect({
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
        <h1 className="text-3xl font-bold text-gray-900">Accedi</h1>
        <p className="text-gray-600 mt-2">Benvenuto in EQB Platform</p>
      </div>

      {/* Login Button */}
      <div className="space-y-4">
        <Button
          onClick={handleLogin}
          className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
          disabled={isLoading}
        >
          Accedi con Auth0
        </Button>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800 text-center">
            🔒 Accesso sicuro tramite Auth0
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <p className="text-center text-gray-600">
          Non hai un account?{' '}
          <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
            Registrati
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
