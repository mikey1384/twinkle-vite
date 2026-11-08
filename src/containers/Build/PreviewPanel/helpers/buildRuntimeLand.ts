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
const LAND_OPERATIONS: Record<
  string,
  { operation: string; scope: 'land:read' | 'land:write'; fields: string[]; publicRead?: boolean }
> = {
  'land:edit': {
    operation: 'edit',
    scope: 'land:write',
    fields: ['region', 'cells', 'format', 'cause', 'at']
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
    fields: ['region', 'x', 'y', 'z', 'before', 'key', 'since', 'order', 'sinceAt']
  },
  // The signed-in player's own blocks (who is decided by the server from the
  // token, never by the app).
  'land:mine': { operation: 'mine', scope: 'land:read', fields: ['region', 'ignore'] }
};

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
  // A signed-out visitor of a public app reads through the public route.
  publicRead: boolean;
}

// What one land:<op> request becomes. Signed-out visitors (guests) of a
// public app may read cells and plots; every other call needs sign-in (the
// caller then asks for a token, which shows the sign-in banner to a guest).
export function planLandRequest(
  type: string,
  payload: any,
  { signedIn, publicApp }: { signedIn: boolean; publicApp: boolean }
): LandRequestPlan {
  const entry = LAND_OPERATIONS[type];
  if (!entry) throw landRequestError('Unknown land request.', 'land_operation_unknown');
  return {
    operation: entry.operation,
    scope: entry.scope,
    body: pick(payload, entry.fields),
    publicRead: Boolean(entry.publicRead && !signedIn && publicApp)
  };
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
// (only a valid published-runtime grant earns builder credit).
export function worldJoinLand(payload: any, grant: string | null) {
  if (payload?.land === undefined || payload?.land === null) return undefined;
  return {
    region: payload.land?.region,
    ...(grant ? { grant } : {})
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

// "This app was updated. Reload" (design section 6): the banner shows when
// the server says a newer published version asks for a reload and this tab
// runs another one (older, or newer after a rollback). A draft preview (no published version mounted) never
// shows it.
export function shouldShowAppReloadBanner({
  event,
  buildId,
  mountedArtifactVersionId
}: {
  event: any;
  buildId: number | null | undefined;
  mountedArtifactVersionId: number | null | undefined;
}) {
  if (!event?.askReload) return false;
  if (!buildId || Number(event.buildId) !== Number(buildId)) return false;
  const mounted = Number(mountedArtifactVersionId || 0);
  const latest = Number(event.artifactVersionId || 0);
  return mounted > 0 && latest > 0 && latest !== mounted;
}
