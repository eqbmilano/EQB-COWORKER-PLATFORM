"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";

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

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function GoogleSignInButton({ onSuccess, className = "" }: GoogleSignInButtonProps) {
  const router = useRouter();
  const { loginWithGoogle, setError } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  // Only enable Google button when explicitly marked production to avoid preview-origin 403s
  const isProd = process.env.NEXT_PUBLIC_APP_ENV === "production";

  const handleCredentialResponse = useCallback(
    async (response: CredentialResponse) => {
      setIsLoading(true);
      try {
        if (!response.credential) {
          throw new Error("No credential received from Google");
        }
        await loginWithGoogle(response.credential);
        onSuccess?.();
        router.push("/dashboard");
      } catch (error) {
        setError(error instanceof Error ? error.message : "Google sign-in failed");
        setIsLoading(false);
      }
    },
    [loginWithGoogle, router, setError, onSuccess],
  );

  useEffect(() => {
    // Hide the button in non-production environments to avoid Google origin errors in previews
    if (!isProd) return;

    // Load Google Sign-In script
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (!clientId) {
        setError("Google client ID non configurato");
        return;
      }
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        const googleButton = document.getElementById("google-signin-button");
        if (googleButton) {
          window.google.accounts.id.renderButton(googleButton, {
            theme: "outline",
            size: "large",
            // fixed width avoids GSI invalid width warnings
            width: 320,
            text: "signup_with",
          });
        }
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [handleCredentialResponse, clientId, setError, isProd]);

  if (!isProd) {
    return null;
  }

  if (isLoading) {
    return (
      <div
        className={`w-full h-14 bg-white/10 rounded-xl flex items-center justify-center ${className}`}
      >
        <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  return <div id="google-signin-button" className={className} />;
}
