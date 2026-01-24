'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function GoogleSignInButton({ onSuccess, className = '' }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
        });

        const googleButton = document.getElementById('google-signin-button');
        if (googleButton) {
          window.google.accounts.id.renderButton(googleButton, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signup_with',
          });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    try {
      await loginWithGoogle(response.credential);
      onSuccess?.();
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`w-full h-14 bg-white/10 rounded-xl flex items-center justify-center ${className}`}>
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <div id="google-signin-button" className={className} />;
}
