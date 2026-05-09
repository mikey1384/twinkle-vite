import type {
  Dispatch,
  RefObject,
  SetStateAction
} from 'react';
import { getStoredItem, setStoredItem } from '~/helpers/userDataHelpers';
import type { Build } from '../types';

const GUEST_SESSION_STORAGE_KEY = 'twinkle_build_guest_session_id';
const GUEST_RESTRICTION_ERROR_MESSAGE =
  'This feature requires signing in because it uses user-only data.';

export type AsyncRequestRef = RefObject<(...args: any[]) => Promise<any>>;

interface BuildApiTokenState {
  buildId?: number;
  token: string;
  scopes: string[];
  expiresAt: number;
}

export interface PreviewHostBridgeAuth {
  buildRef: RefObject<Build>;
  isOwnerRef: RefObject<boolean>;
  userIdRef: RefObject<number | null>;
  usernameRef: RefObject<string | null>;
  profilePicUrlRef: RefObject<string | null>;
  guestSessionIdRef: RefObject<string | null>;
  buildApiTokenRef: RefObject<BuildApiTokenState | null>;
  getBuildApiTokenRef: AsyncRequestRef;
  setGuestRestrictionBannerVisible: Dispatch<SetStateAction<boolean>>;
}

export function isGuestViewerActive(previewAuth: PreviewHostBridgeAuth) {
  return (
    Boolean(previewAuth.buildRef.current?.isPublic) &&
    !previewAuth.isOwnerRef.current &&
    !previewAuth.userIdRef.current
  );
}

export function ensureGuestSessionId(previewAuth: PreviewHostBridgeAuth) {
  if (previewAuth.guestSessionIdRef.current) {
    return previewAuth.guestSessionIdRef.current;
  }

  const storedGuestSessionId = getStoredItem(GUEST_SESSION_STORAGE_KEY);
  if (storedGuestSessionId) {
    previewAuth.guestSessionIdRef.current = storedGuestSessionId;
    return storedGuestSessionId;
  }

  const generatedGuestSessionId = `guest_${
    window.crypto?.randomUUID?.() ||
    `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
  }`;

  previewAuth.guestSessionIdRef.current = generatedGuestSessionId;

  setStoredItem(GUEST_SESSION_STORAGE_KEY, generatedGuestSessionId);

  return generatedGuestSessionId;
}

export function triggerGuestRestriction(previewAuth: PreviewHostBridgeAuth) {
  previewAuth.setGuestRestrictionBannerVisible(true);
  const error: any = new Error(GUEST_RESTRICTION_ERROR_MESSAGE);
  error.code = 'guest_restricted';
  throw error;
}

export async function ensureBuildApiToken(
  requiredScopes: string[],
  previewAuth: PreviewHostBridgeAuth
) {
  if (isGuestViewerActive(previewAuth)) {
    triggerGuestRestriction(previewAuth);
  }

  const now = Math.floor(Date.now() / 1000);
  const activeBuild = previewAuth.buildRef.current;
  if (!activeBuild?.id) {
    throw new Error('Build not found');
  }
  const cached = previewAuth.buildApiTokenRef.current;
  if (
    cached &&
    Number(cached.buildId || 0) === Number(activeBuild.id || 0) &&
    cached.expiresAt - 30 > now &&
    requiredScopes.every((scope) => cached.scopes.includes(scope))
  ) {
    return cached.token;
  }

  const scopeSet = new Set<string>([
    ...(Number(cached?.buildId || 0) === Number(activeBuild.id || 0)
      ? cached?.scopes || []
      : []),
    ...requiredScopes
  ]);
  const requestedScopes = Array.from(scopeSet);

  const result = await previewAuth.getBuildApiTokenRef.current({
    buildId: activeBuild.id,
    scopes: requestedScopes
  });
  if (!result?.token) {
    throw new Error('Failed to obtain API token');
  }
  previewAuth.buildApiTokenRef.current = {
    buildId: Number(activeBuild.id || 0) || undefined,
    token: result.token,
    scopes: result.scopes || requestedScopes,
    expiresAt: result.expiresAt || now + 600
  };
  return result.token;
}

export function getViewerInfo(previewAuth: PreviewHostBridgeAuth) {
  if (previewAuth.userIdRef.current) {
    return {
      id: previewAuth.userIdRef.current,
      username: previewAuth.usernameRef.current,
      profilePicUrl: previewAuth.profilePicUrlRef.current,
      isLoggedIn: true,
      isOwner: Boolean(previewAuth.isOwnerRef.current),
      isGuest: false
    };
  }

  if (isGuestViewerActive(previewAuth)) {
    return {
      id: ensureGuestSessionId(previewAuth),
      username: 'Guest',
      profilePicUrl: null,
      isLoggedIn: false,
      isOwner: false,
      isGuest: true
    };
  }

  return {
    id: null,
    username: null,
    profilePicUrl: null,
    isLoggedIn: false,
    isOwner: Boolean(previewAuth.isOwnerRef.current),
    isGuest: false
  };
}
