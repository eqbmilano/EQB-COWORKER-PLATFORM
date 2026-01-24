'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
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
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-slate-50 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-8">
        <div className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.35)] p-8 sm:p-10">
          {/* Logo/Icon */}
          <div className="text-center mb-6">
            <div className="mx-auto h-20 w-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-sky-500 rounded-2xl flex items-center justify-center shadow-2xl">
              <span className="text-4xl">🚀</span>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-2 text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">EQB Platform</h1>
            <p className="text-base sm:text-lg text-slate-200/80">
              Gestione Appuntamenti e Fatture con un tocco premium
            </p>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
            {[
              { icon: '📅', title: 'Appuntamenti', desc: 'Prenota e gestisci facilmente' },
              { icon: '👥', title: 'Clienti', desc: 'Profili e storico completi' },
              { icon: '💼', title: 'Fatture', desc: 'Automatizza e controlla i pagamenti' },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-inner"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-semibold text-slate-50">{item.title}</h3>
                <p className="text-sm text-slate-200/80">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-8">
            <Button href="/auth/login" className="w-full py-4 text-lg">
              Accedi
            </Button>

            <Button href="/auth/signup" variant="secondary" className="w-full py-4 text-lg">
              Registrati
            </Button>
          </div>

          {/* Footer */}
          <p className="text-sm text-slate-200/70 pt-6 text-center">
            Ottimizzato per dispositivi mobili 📱
          </p>
        </div>
      </div>
    </main>
  );
}
