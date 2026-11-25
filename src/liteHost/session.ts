// Sign in with Twinkle on a Lumine app's own address (lite host side).
// See twinkle-api helpers/build/appHosting/appSession.ts for the whole flow.
// The app pass and refresh token live in this origin's localStorage (the
// app's code runs on another origin and can never read them).

export interface LiteHostConfig {
  v: number;
  buildId: number;
  versionId: number;
  slug: string;
  title: string;
  description: string;
  owner: { id: number; username: string };
  thumbnailUrl: string | null;
  root: string;
  runOrigin: string;
  frameSrc: string;
  apiOrigin: string;
  siteOrigin: string;
  publishedAt: number;
}

export interface AppSession {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  user: { id: number; username: string };
  scopes: string[];
  // who this is inside the app (twinkle-api appHosting/appPlayers.ts)
  appPlayer?: { id: number; kind: 'twinkle' | 'app'; linked: boolean } | null;
}

const SESSION_KEY = (buildId: number) => `lumine-app-session:${buildId}`;
const PKCE_KEY = (buildId: number) => `lumine-app-pkce:${buildId}`;

function storageGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // private mode: the session lasts this page only
  }
}

function base64Url(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createPkcePair() {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64Url(verifierBytes);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return { verifier, challenge: base64Url(new Uint8Array(digest)) };
}

export function createSessionStore(
  config: LiteHostConfig,
  {
    beforeSignedIn
  }: {
    // Runs with a new session's pass before the app hears about it (the
    // guest's on-device progress is carried over first, so the app's first
    // read as the member already finds it). Never blocks for long.
    beforeSignedIn?: (accessToken: string) => Promise<void>;
  } = {}
) {
  let session: AppSession | null = null;
  let refreshing: Promise<AppSession | null> | null = null;
  const listeners = new Set<(session: AppSession | null) => void>();
  try {
    const raw = storageGet(SESSION_KEY(config.buildId));
    session = raw ? (JSON.parse(raw) as AppSession) : null;
  } catch {
    session = null;
  }

  function set(next: AppSession | null) {
    session = next;
    storageSet(SESSION_KEY(config.buildId), next ? JSON.stringify(next) : null);
    listeners.forEach((listener) => listener(next));
  }

  async function post(path: string, body: unknown, token?: string) {
    const response = await fetch(`${config.apiOrigin}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: token } : {})
      },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error: any = new Error(data?.error || `Request failed (${response.status})`);
      error.status = response.status;
      error.code = data?.code;
      throw error;
    }
    return data;
  }

  // Another tab of this app may have refreshed (and rotated the refresh
  // token) already: its newer session is in storage.
  function adoptStoredIfNewer() {
    try {
      const raw = storageGet(SESSION_KEY(config.buildId));
      const stored = raw ? (JSON.parse(raw) as AppSession) : null;
      if (
        stored &&
        session &&
        stored.refreshToken !== session.refreshToken &&
        stored.user?.id === session.user?.id &&
        Number(stored.expiresAt) >= Number(session.expiresAt)
      ) {
        session = stored;
        listeners.forEach((listener) => listener(stored));
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  async function refresh(): Promise<AppSession | null> {
    if (!session) return null;
    if (adoptStoredIfNewer() && session.expiresAt - 60 > Date.now() / 1000) return session;
    refreshing ||= (async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const data = await post('/build/app-session/refresh', {
            buildId: config.buildId,
            refreshToken: session!.refreshToken
          });
          set({
            accessToken: data.accessToken,
            expiresAt: data.expiresAt,
            refreshToken: data.refreshToken,
            user: data.user,
            scopes: data.scopes,
            appPlayer: data.appPlayer || session?.appPlayer || null
          });
          return session;
        } catch (error: any) {
          // 409: another tab rotated this refresh token a moment ago; pick
          // up its tokens from storage (or try once more).
          if (error?.status === 409) {
            await new Promise((resolve) => window.setTimeout(resolve, 300));
            if (adoptStoredIfNewer()) return session;
            continue;
          }
          if (error?.status === 401 || error?.status === 403) set(null);
          return null;
        }
      }
      return null;
    })().finally(() => {
      refreshing = null;
    });
    return refreshing;
  }

  return {
    get: () => session,
    // app accounts (phase B) start their session on this page
    adopt: async (data: any) => {
      await adopt(data);
      return session;
    },
    post,
    subscribe(listener: (session: AppSession | null) => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    async accessToken(): Promise<string | null> {
      if (!session) return null;
      if (session.expiresAt - 60 > Date.now() / 1000) return session.accessToken;
      const next = await refresh();
      return next?.accessToken || null;
    },
    // Starts sign-in: a popup to twin-kle.com (or a full redirect when the
    // popup is blocked). Resolves with the session, or null if cancelled.
    async signIn(): Promise<AppSession | null> {
      const { verifier, challenge } = await createPkcePair();
      const state = base64Url(crypto.getRandomValues(new Uint8Array(12)));
      // The code is bound to this exact page (the API checks it again when
      // the code is traded).
      const returnUrl = window.location.href.split('#')[0];
      storageSet(PKCE_KEY(config.buildId), JSON.stringify({ verifier, state, returnUrl }));
      const url = new URL('/lumine-app/signin', config.siteOrigin);
      url.searchParams.set('app', String(config.buildId));
      url.searchParams.set('origin', window.location.origin);
      url.searchParams.set('challenge', challenge);
      url.searchParams.set('state', state);
      url.searchParams.set('return', returnUrl);
      const popup = window.open(url.toString(), 'lumine-signin', 'width=460,height=640');
      if (!popup) {
        // Popup blocked: the sign-in page redirects back here with the code.
        window.location.assign(url.toString());
        return null;
      }
      return new Promise((resolve) => {
        const siteOrigin = new URL(config.siteOrigin).origin;
        const timer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(timer);
            window.removeEventListener('message', onMessage);
            resolve(session);
          }
        }, 500);
        const onMessage = async (event: MessageEvent) => {
          if (event.origin !== siteOrigin || event.source !== popup) return;
          const data = event.data || {};
          if (data.source !== 'lumine-signin') return;
          window.removeEventListener('message', onMessage);
          window.clearInterval(timer);
          try {
            popup.close();
          } catch {
            // ignore
          }
          if (!data.code || data.state !== state) return resolve(null);
          resolve(await finish(String(data.code), verifier, returnUrl));
        };
        window.addEventListener('message', onMessage);
      });
    },
    // Called on load: a redirect sign-in returns with #lumine_code=…&state=…
    async completeRedirect(): Promise<AppSession | null> {
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const code = hash.get('lumine_code');
      if (!code) return null;
      // Drop the code from the address bar. A path like //x would make
      // replaceState throw (cross-origin), so use the full URL and never let
      // it stop the page from starting (re-review nit 1).
      try {
        history.replaceState(null, '', window.location.href.split('#')[0]);
      } catch {
        /* the page still works with the old address */
      }
      let saved: { verifier: string; state: string; returnUrl?: string } | null = null;
      try {
        saved = JSON.parse(storageGet(PKCE_KEY(config.buildId)) || 'null');
      } catch {
        saved = null;
      }
      if (!saved || saved.state !== hash.get('state')) return null;
      return finish(code, saved.verifier, saved.returnUrl || window.location.href.split('#')[0]);
    },
    async signOut() {
      const token = await this.accessToken();
      set(null);
      if (token) {
        await post(`/build/${config.buildId}/app-session/signout`, {}, token).catch(() => {});
      }
    }
  };

  async function finish(code: string, verifier: string, redirectUri: string) {
    storageSet(PKCE_KEY(config.buildId), null);
    try {
      const data = await post('/build/app-session/token', {
        buildId: config.buildId,
        code,
        codeVerifier: verifier,
        redirectUri
      });
      await adopt(data);
      return session;
    } catch {
      return null;
    }
  }

  // A new session (sign-in, or an app account's sign-in/sign-up): carry the
  // guest's progress over first, then tell the page.
  async function adopt(data: any) {
    if (beforeSignedIn) {
      await Promise.race([
        beforeSignedIn(String(data.accessToken)).catch(() => {}),
        new Promise((resolve) => window.setTimeout(resolve, 4000))
      ]);
    }
    set({
      accessToken: data.accessToken,
      expiresAt: data.expiresAt,
      refreshToken: data.refreshToken,
      user: data.user,
      scopes: data.scopes,
      appPlayer: data.appPlayer || null
    });
  }
}

export type SessionStore = ReturnType<typeof createSessionStore>;
