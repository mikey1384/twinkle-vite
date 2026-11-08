// Host side of Twinkle.land (design: projects/lumine-land-enforcement/
// DESIGN.md; wire contract: CONTRACT.md). The app frame packs and unpacks
// cells itself (the API's SDK landScript.ts); this side only carries
// strings, adds what only the website has (the build token, the
// published-runtime grant, the world socket) and never forwards anything
// the app could use to name a player, a price or a credit. Twinkle checks
// every edit on the server.

export const LAND_REQUEST_TYPES = new Set([
  'land:edit',
  'land:cells',
  'land:plots',
  'land:set-rules',
  'land:check',
  'land:history',
  'land:mine'
]);

// land:<op> → the API's /build/:id/api/land/<op>, with the token scope it
// needs and the fields the app may send (anything else is dropped).
// publicRead: a signed-out visitor of a public app reads it through the
// public route. publicGuest: a signed-out visitor uses the public route as
// their server-issued land guest identity (the token a world join returned;
// review L5): edits on a world switch, and "who changed this block?" on
// free land (one cell's history; plot history stays the holder's).
const LAND_OPERATIONS: Record<
  string,
  {
    operation: string;
    scope: 'land:read' | 'land:write';
    fields: string[];
    publicRead?: boolean;
    publicGuest?: boolean;
    // Fields a guest may not send (a carried-over time is a member's own).
    guestDrops?: string[];
  }
> = {
  'land:edit': {
    operation: 'edit',
    scope: 'land:write',
    fields: ['region', 'cells', 'format', 'cause', 'at'],
    publicGuest: true,
    guestDrops: ['at']
  },
  'land:cells': {
    operation: 'cells',
    scope: 'land:read',
    fields: ['region', 'since', 'area', 'cursor'],
    publicRead: true
  },
  'land:plots': {
    operation: 'plots',
    scope: 'land:read',
    fields: ['region', 'area', 'key', 'cursor'],
    publicRead: true
  },
  'land:set-rules': {
    operation: 'set-rules',
    scope: 'land:write',
    fields: ['key', 'build', 'use', 'switches', 'friends']
  },
  'land:check': { operation: 'check', scope: 'land:read', fields: ['key', 'priceId'] },
  'land:history': {
    operation: 'history',
    scope: 'land:read',
    fields: ['region', 'x', 'y', 'z', 'before', 'key', 'since', 'order', 'sinceAt'],
    publicGuest: true
  },
  // The signed-in player's own blocks (who is decided by the server from the
  // token, never by the app).
  'land:mine': { operation: 'mine', scope: 'land:read', fields: ['region', 'ignore'] }
};

// A world socket ack that failed: its details (land_throttled's
// retryAfterSeconds) go onto the frame's error like the HTTP path's
// (review L1), so the app waits as long as Twinkle asked.
export function attachWorldAckDetails<T extends Error>(error: T, response: any) {
  if (response?.details === undefined) return error;
  const target = error as T & { details?: unknown; retryAfterSeconds?: number };
  target.details = response.details;
  const retry = Number(response.details?.retryAfterSeconds);
  if (Number.isFinite(retry) && retry > 0) target.retryAfterSeconds = retry;
  return error;
}

export function landRequestError(message: string, code: string, details?: unknown) {
  const error = new Error(message) as Error & { code?: string; details?: unknown };
  error.code = code;
  if (details !== undefined) error.details = details;
  return error;
}

const pick = (payload: any, keys: string[]) =>
  Object.fromEntries(keys.filter((key) => payload?.[key] !== undefined).map((key) => [key, payload[key]]));

export interface LandRequestPlan {
  operation: string;
  scope: 'land:read' | 'land:write';
  body: Record<string, unknown>;
  // A signed-out visitor of a public app goes through the public route
  // (reads, and a guest's edits / one cell's history).
  publicRead: boolean;
  // The guest's land token goes with it (x-land-guest).
  guestToken: string | null;
}

// What one land:<op> request becomes. Signed-out visitors (guests) of a
// public app read cells and plots, and edit or ask who changed a block as
// their land guest identity, all through the public route (no sign-in
// banner, review L5). Every other call needs sign-in (the caller then asks
// for a token, which shows the sign-in banner to a guest).
export function planLandRequest(
  type: string,
  payload: any,
  { signedIn, publicApp, guestToken = null }: { signedIn: boolean; publicApp: boolean; guestToken?: string | null }
): LandRequestPlan {
  const entry = LAND_OPERATIONS[type];
  if (!entry) throw landRequestError('Unknown land request.', 'land_operation_unknown');
  const guest = !signedIn && publicApp;
  const body = pick(payload, entry.fields);
  const publicGuest = Boolean(guest && entry.publicGuest && (entry.operation !== 'history' || body.key === undefined));
  if (publicGuest) for (const field of entry.guestDrops || []) delete body[field];
  return {
    operation: entry.operation,
    scope: entry.scope,
    body,
    publicRead: Boolean(guest && (entry.publicRead || publicGuest)),
    guestToken: publicGuest && entry.operation === 'edit' ? guestToken || null : null
  };
}

// A guest's land identity token, per app (review H1): the server issues it
// at the world join (ack land.guest); the host keeps it for the next join and
// for the guest's public land calls, and never hands it to the app frame.
const LAND_GUEST_STORAGE_PREFIX = 'twinkle-land-guest:';
export function createLandGuestTokens(storage: Pick<Storage, 'getItem' | 'setItem'> | null = null) {
  const memory = new Map<number, string>();
  return {
    get(buildId: number) {
      if (memory.has(buildId)) return memory.get(buildId) || null;
      try {
        const stored = storage?.getItem(`${LAND_GUEST_STORAGE_PREFIX}${buildId}`);
        if (stored) memory.set(buildId, stored);
        return stored || null;
      } catch {
        return null;
      }
    },
    set(buildId: number, token: unknown) {
      if (typeof token !== 'string' || !token || token.length > 128) return;
      memory.set(buildId, token);
      try {
        storage?.setItem(`${LAND_GUEST_STORAGE_PREFIX}${buildId}`, token);
      } catch {
        // private window or blocked storage: the token lives for this page
      }
    }
  };
}
// The world join's answer for the frame: the guest's land token stays here.
export function stripLandGuestToken(response: any) {
  if (!response?.land || typeof response.land !== 'object' || !('guest' in response.land)) return response;
  const { guest: _guest, ...land } = response.land;
  return { ...response, land };
}

// The world socket's edit: only the session, the packed cells and the cause.
export function worldEditPayload(payload: any, grant: string | null) {
  return {
    sessionId: payload?.sessionId,
    cells: payload?.cells,
    ...(payload?.format !== undefined ? { format: payload.format } : {}),
    ...(payload?.cause !== undefined && payload?.cause !== null && payload?.cause !== ''
      ? { cause: payload.cause }
      : {}),
    ...(grant ? { grant } : {})
  };
}

// world.join's land binding: the region the app asked for plus the grant
// (only a valid published-runtime grant earns builder credit), and for a
// guest the land token a previous join returned.
export function worldJoinLand(payload: any, grant: string | null, guestToken: string | null = null) {
  if (payload?.land === undefined || payload?.land === null) return undefined;
  return {
    region: payload.land?.region,
    ...(grant ? { grant } : {}),
    ...(guestToken ? { guest: guestToken } : {})
  };
}

export interface LandWorldSession {
  sourceWindow: Window;
  buildId: number;
  landRegion?: string | null;
}

// build_app_land_event → the frames with a world session bound to that land
// world, each window once (one socket may hold several sessions).
export function landEventTargetWindows(sessions: Iterable<LandWorldSession>, payload: any) {
  const buildId = Number(payload?.buildId || 0);
  const region = typeof payload?.region === 'string' ? payload.region : '';
  const windows: Window[] = [];
  if (!buildId || !region || !payload?.event) return windows;
  for (const session of sessions) {
    if (session.buildId !== buildId || session.landRegion !== region) continue;
    if (!windows.includes(session.sourceWindow)) windows.push(session.sourceWindow);
  }
  return windows;
}

// The published-runtime grant lives an hour (rewardRuntimeGrant.ts). A
// land world can stay open longer, so the host renews it shortly before it
// ends; a failed renewal keeps the old one (edits still go through, they
// just stop earning builder credit, which the ack's credit: null shows).
export function landGrantExpiresAt(grant: string | null | undefined) {
  if (!grant) return null;
  const part = grant.split('.')[1];
  if (!part) return null;
  try {
    const json = JSON.parse(
      decodeURIComponent(
        Array.from(atob(part.replace(/-/g, '+').replace(/_/g, '/')))
          .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
          .join('')
      )
    );
    return Number.isFinite(json?.exp) ? Number(json.exp) : null;
  } catch {
    return null;
  }
}

export const LAND_GRANT_RENEW_BEFORE_SECONDS = 300;
export function createLandGrantKeeper({
  renew,
  now = () => Date.now() / 1000
}: {
  renew: (grant: string) => Promise<string>;
  now?: () => number;
}) {
  let current: { original: string; grant: string; pending?: Promise<string> } | null = null;
  return async function freshGrant(original: string | null | undefined) {
    if (!original) return null;
    if (!current || current.original !== original) current = { original, grant: original };
    const entry = current;
    const exp = landGrantExpiresAt(entry.grant);
    if (exp === null || exp - now() > LAND_GRANT_RENEW_BEFORE_SECONDS) return entry.grant;
    if (!entry.pending) {
      entry.pending = renew(entry.grant)
        .then((grant) => {
          if (typeof grant === 'string' && grant) entry.grant = grant;
          return entry.grant;
        })
        .catch(() => entry.grant)
        .finally(() => {
          entry.pending = undefined;
        });
    }
    return entry.pending;
  };
}

// The server's "this app was updated" ask (build_app_updated, sent on every
// live-version change of a land or multiplayer app). It feeds the website's one
// update notice (PublishedUpdateNotice via usePublishedUpdate) at once instead of
// waiting for its next poll: one notice per update, never a second banner (Mikey,
// 11-09). Returns the new live version when it differs from the one this tab
// runs; null otherwise (other apps, drafts and previews never).
export function askReloadVersion({
  event,
  buildId,
  loadedVersion
}: {
  event: any;
  buildId: number | null | undefined;
  loadedVersion: number | null | undefined;
}): number | null {
  if (!event?.askReload) return null;
  if (!buildId || Number(event.buildId) !== Number(buildId)) return null;
  const mounted = Number(loadedVersion || 0);
  const latest = Number(event.artifactVersionId || 0);
  return mounted > 0 && Number.isSafeInteger(latest) && latest > 0 && latest !== mounted ? latest : null;
}
