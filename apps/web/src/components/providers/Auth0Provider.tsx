'use client';

import { Auth0Provider as Auth0ProviderSDK } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';

interface Auth0ProviderProps {
  children: React.ReactNode;
}

export function Auth0Provider({ children }: Auth0ProviderProps) {
  const router = useRouter();

  const domain = process.env.NEXT_PUBLIC_AUTH0_DOMAIN;
  const clientId = process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID;
  const audience = process.env.NEXT_PUBLIC_AUTH0_AUDIENCE;
  const baseUrl = process.env.NEXT_PUBLIC_AUTH0_BASE_URL;

  if (!domain || !clientId) {
    console.error('Auth0 configuration missing');
    return <>{children}</>;
  }

  const onRedirectCallback = (appState: any) => {
    router.push(appState?.returnTo || '/dashboard');
  };

  return (
    <Auth0ProviderSDK
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: baseUrl || (typeof window !== 'undefined' ? window.location.origin : ''),
        audience: audience,
        scope: 'openid profile email',
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0ProviderSDK>
  );
}
