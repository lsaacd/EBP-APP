/**
 * oauthClient — Native Sign in with Apple & Google OAuth (PKCE) client helpers.
 *
 * - Apple: Uses native `expo-apple-authentication` with a fresh SHA-256 hashed nonce
 *   (sent raw to our Cloudflare Worker `/auth/oauth/apple` for strict nonce verification).
 * - Google: Uses `expo-auth-session` Authorization Code + PKCE against our native iOS
 *   Google OAuth Client ID (no client secret needed), exchanging the code for a signed
 *   OIDC `idToken` verified server-side against Google's JWKS.
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as AppleAuthentication from 'expo-apple-authentication';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export interface AppleOAuthPayload {
  identityToken: string;
  nonce: string;
  email?: string | null;
  fullName?: {
    givenName?: string | null;
    familyName?: string | null;
  } | null;
}

export interface GoogleOAuthPayload {
  idToken: string;
}

export function getGoogleClientIdForPlatform(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;
  if (Platform.OS === 'ios') {
    const val =
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      (typeof extra.googleIosClientId === 'string' ? extra.googleIosClientId : '');
    return val.trim();
  }
  if (Platform.OS === 'android') {
    const val =
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      (typeof extra.googleAndroidClientId === 'string' ? extra.googleAndroidClientId : '');
    return val.trim();
  }
  const webVal =
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    (typeof extra.googleWebClientId === 'string' ? extra.googleWebClientId : '');
  return webVal.trim();
}

export function isGoogleSignInConfigured(): boolean {
  return Boolean(getGoogleClientIdForPlatform());
}

export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function performAppleSignIn(): Promise<AppleOAuthPayload> {
  if (Platform.OS !== 'ios') {
    throw new Error('oauth_provider_unavailable');
  }
  const available = await isAppleSignInAvailable();
  if (!available) {
    throw new Error('oauth_provider_unavailable');
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('oauth_failed');
    }

    return {
      identityToken: credential.identityToken,
      nonce: rawNonce,
      email: credential.email,
      fullName: credential.fullName
        ? {
            givenName: credential.fullName.givenName,
            familyName: credential.fullName.familyName,
          }
        : null,
    };
  } catch (err: any) {
    if (err?.code === 'ERR_REQUEST_CANCELED' || err?.message === 'auth_cancelled') {
      throw new Error('auth_cancelled');
    }
    throw err instanceof Error ? err : new Error('oauth_failed');
  }
}

function buildGoogleRedirectUri(clientId: string): string {
  const prefix = clientId.replace(/\.apps\.googleusercontent\.com$/i, '');
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    return `com.googleusercontent.apps.${prefix}:/oauthredirect`;
  }
  return AuthSession.makeRedirectUri({ scheme: 'el-buen-pastor-himnario' });
}

export async function performGoogleSignIn(): Promise<GoogleOAuthPayload> {
  const clientId = getGoogleClientIdForPlatform();
  if (!clientId) {
    throw new Error('oauth_provider_unavailable');
  }

  const redirectUri = buildGoogleRedirectUri(clientId);
  const request = new AuthSession.AuthRequest({
    clientId,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
    extraParams: {
      prompt: 'select_account',
    },
  });

  const result = await request.promptAsync(GOOGLE_DISCOVERY);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    throw new Error('auth_cancelled');
  }
  if (result.type !== 'success' || !result.params?.code) {
    throw new Error('oauth_failed');
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      code: result.params.code,
      redirectUri,
      extraParams: request.codeVerifier
        ? { code_verifier: request.codeVerifier }
        : undefined,
    },
    GOOGLE_DISCOVERY,
  );

  if (!tokenResponse.idToken) {
    throw new Error('oauth_failed');
  }

  return { idToken: tokenResponse.idToken };
}
