import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'] as const;
export const DEFAULT_DRIVE_ACCOUNT_HINT = 'zazadada8899@gmail.com';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

let isSigningIn = false;
// Cache the OAuth access token strictly in memory (never in localStorage or sessionStorage)
let cachedAccessToken: string | null = null;

export function initDriveAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
): Unsubscribe {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
}

export async function signInWithGoogleDrive(
  loginHint: string = DEFAULT_DRIVE_ACCOUNT_HINT
): Promise<{ user: User; accessToken: string }> {
  try {
    isSigningIn = true;
    const provider = new GoogleAuthProvider();
    for (const scope of SCOPES) {
      provider.addScope(scope);
    }
    const customParams: Record<string, string> = {
      prompt: 'select_account',
    };
    if (loginHint.trim()) {
      customParams.login_hint = loginHint.trim();
    }
    provider.setCustomParameters(customParams);

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Google Drive хандалтын токен авч чадсангүй. Дахин нэвтэрнэ үү.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
}

export function getCachedDriveAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearCachedDriveAccessToken(): void {
  cachedAccessToken = null;
}

export async function signOutGoogleDrive(): Promise<void> {
  cachedAccessToken = null;
  await auth.signOut();
}
