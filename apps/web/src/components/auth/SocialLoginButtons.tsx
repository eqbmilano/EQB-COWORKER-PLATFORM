'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface CredentialResponse {
  credential?: string;
  clientId?: string;
  select_by?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, options: object) => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface SocialLoginButtonsProps {
  onSuccess?: () => void;
  className?: string;
}

const SocialButton = ({
  provider,
  icon,
  label,
  onClick,
  isLoading,
}: {
  provider: 'google' | 'instagram' | 'linkedin';
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isLoading: boolean;
}) => {
  const colors = {
    google: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    instagram: 'from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600',
    linkedin: 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
  };

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        relative group w-full h-12 rounded-xl font-medium text-white text-sm
        bg-gradient-to-r ${colors[provider]}
        border border-white/10 backdrop-blur
        transition-all duration-300 ease-out
        hover:shadow-lg hover:shadow-blue-500/25
        disabled:opacity-50 disabled:cursor-not-allowed
        overflow-hidden
      `}
    >
      {/* Animated background */}
      <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300" />
      
      {/* Ripple effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      </div>

      {/* Content */}
      <div className="relative flex items-center justify-center gap-2 h-full">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <span className="text-lg">{icon}</span>
            <span>{label}</span>
          </>
        )}
      </div>

      {/* Border animation on hover */}
      <div className="absolute inset-0 rounded-xl border border-white/20 opacity-0 group-hover:opacity-100 group-hover:border-white/40 transition-all duration-300" />
    </button>
  );
};

export default function SocialLoginButtons({ onSuccess, className = '' }: SocialLoginButtonsProps) {
  const router = useRouter();
  const { loginWithGoogle, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === 'production';

  const handleGoogleCredentialResponse = useCallback(async (response: CredentialResponse) => {
    setIsLoading('google');
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }
      await loginWithGoogle(response.credential);
      onSuccess?.();
      router.push('/dashboard');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Google sign-in failed');
      setIsLoading(null);
    }
  }, [loginWithGoogle, router, setError, onSuccess]);

  const handleInstagramLogin = () => {
    setIsLoading('instagram');
    // Instagram OAuth flow - reindirizza a endpoint API
    const redirectUri = `${window.location.origin}/api/auth/instagram/callback`;
    const instagramAuthUrl = `https://www.instagram.com/oauth/authorize?client_id=${process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user_profile&response_type=code`;
    window.location.href = instagramAuthUrl;
  };

  const handleLinkedInLogin = () => {
    setIsLoading('linkedin');
    // LinkedIn OAuth flow - reindirizza a endpoint API
    const redirectUri = `${window.location.origin}/api/auth/linkedin/callback`;
    const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=r_liteprofile%20r_emailaddress`;
    window.location.href = linkedinAuthUrl;
  };

  useEffect(() => {
    if (!isProd) return;

    // Load Google Sign-In script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!clientId) {
        setError('Google client ID non configurato');
        return;
      }
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        });
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Script already removed
      }
    };
  }, [handleGoogleCredentialResponse, clientId, setError, isProd]);

  if (!isProd) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="grid grid-cols-1 gap-3">
        {/* Google */}
        <SocialButton
          provider="google"
          icon="🔵"
          label="Accedi con Google"
          onClick={() => {
            const googleButton = document.querySelector('[data-callback]') as HTMLElement;
            googleButton?.click();
          }}
          isLoading={isLoading === 'google'}
        />

        {/* Instagram */}
        <SocialButton
          provider="instagram"
          icon="📷"
          label="Accedi con Instagram"
          onClick={handleInstagramLogin}
          isLoading={isLoading === 'instagram'}
        />

        {/* LinkedIn */}
        <SocialButton
          provider="linkedin"
          icon="💼"
          label="Accedi con LinkedIn"
          onClick={handleLinkedInLogin}
          isLoading={isLoading === 'linkedin'}
        />
      </div>

      {/* Hidden Google Button for OAuth trigger */}
      <div id="google-signin-button-hidden" className="hidden" />
    </div>
  );
}
