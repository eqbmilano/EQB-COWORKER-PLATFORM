/**
 * Dashboard Layout
 */
'use client';

import { ProtectedRoute } from '@/components/shared/ProtectedRoute';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import {
  Home,
  Calendar,
  Users,
  FileText,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/dashboard/appointments', label: 'Appuntamenti', icon: Calendar },
    { href: '/dashboard/clients', label: 'Clienti', icon: Users },
    { href: '/dashboard/invoices', label: 'Fatture', icon: FileText },
    { href: '/dashboard/profile', label: 'Profilo', icon: User },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900">
        {/* Top Bar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-white/10 backdrop-blur border-b border-white/20">
          <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
              >
                {sidebarOpen ? (
                  <X className="w-6 h-6 text-white" />
                ) : (
                  <Menu className="w-6 h-6 text-white" />
                )}
              </button>
              <h1 className="text-xl font-bold text-white">EQB Platform</h1>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition text-sm"
            >
              <LogOut className="w-4 h-4" />
              Esci
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div
          className={`fixed left-0 top-16 bottom-0 w-64 bg-white/10 backdrop-blur border-r border-white/20 transform transition-transform md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:relative md:top-0 z-30`}
        >
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-200 hover:bg-white/10 rounded-lg transition"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <main className="pt-20 md:pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
