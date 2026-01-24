import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Auth0Provider } from '@/components/providers/Auth0Provider';

export const metadata: Metadata = {
  title: 'EQB Platform - Appointment Booking & Invoice Management',
  description: 'Manage appointments and invoices for your wellness center',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EQB Platform',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#3b82f6',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body className="bg-gray-50">
        <Auth0Provider>{children}</Auth0Provider>
      </body>
    </html>
  );
}
