/**
 * Login Page - Custom JWT + Social OAuth (Google, Instagram, LinkedIn)
 */
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/authStore';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { Mail, Lock, AlertCircle, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuthStore();
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      useAuthStore.setState({ error: 'Compila tutti i campi' });
      return;
    }

    try {
      await login(email, password);
      setSuccessMessage('Login riuscito! Reindirizzamento...');
      setTimeout(() => router.push('/dashboard'), 500);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <Card className="p-8 sm:p-10 max-w-md mx-auto border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.35)]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="mx-auto h-16 w-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform hover:scale-110 transition">
          <span className="text-3xl">🚀</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Accedi</h1>
        <p className="text-slate-300 mt-2 text-sm">Benvenuto su EQB Platform</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-500/10 border border-green-500/50 rounded-xl flex items-start gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="text-green-300 text-sm">{successMessage}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition backdrop-blur"
              placeholder="tuo@email.com"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition backdrop-blur"
              placeholder="••••••••"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white transition"
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full py-3.5 text-base font-medium mt-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Accesso in corso...
            </span>
          ) : (
            'Accedi'
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white/5 text-slate-400">O continua con i social</span>
        </div>
      </div>

      {/* Social Sign-In */}
      <SocialLoginButtons className="w-full" />

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/10">
        <p className="text-center text-slate-300 text-sm">
          Non hai un account?{' '}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition">
            Registrati
          </Link>
        </p>
        <p className="text-center text-xs text-slate-500 mt-4">
          <Link href="/" className="hover:text-slate-400 transition">
            ← Torna alla home
          </Link>
        </p>
      </div>
    </Card>
  );
}
