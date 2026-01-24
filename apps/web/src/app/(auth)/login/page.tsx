/**
 * Login Page - Custom JWT Authentication
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, setError } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      // Error already set in store
      console.error('Login error:', err);
    }
  };

  return (
    <Card className="p-8 sm:p-10 max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 rounded-xl flex items-center justify-center shadow-lg mb-4">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Accedi</h1>
        <p className="text-slate-600 mt-2">Benvenuto in EQB Platform</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-900 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="tuo@email.com"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-900 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="••••••••"
            required
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <Button type="submit" className="w-full py-3 text-lg" disabled={isLoading}>
          {isLoading ? 'Accesso in corso...' : 'Accedi'}
        </Button>
      </form>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <p className="text-center text-slate-600">
          Non hai un account?{' '}
          <Link href="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Registrati
          </Link>
        </p>
        <p className="text-center text-sm text-slate-500 mt-4">
          <Link href="/" className="hover:text-slate-700">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </Card>
  );
}
