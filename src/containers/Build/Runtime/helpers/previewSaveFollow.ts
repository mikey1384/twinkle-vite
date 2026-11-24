// "Preview follows new saves" (Mikey 11-24): an open saved-workspace preview
// (/app/<id>?runtimeSource=workspace: a Build's draft, or a team branch,
// which is its own build) loads each new save without a browser reload.
// The server sends build_version_saved to the build's preview room after the
// save commits (twinkle-api helpers/build/previewUpdateEvents.ts). The
// published /app view never listens: it follows publishes only.

export const BUILD_VERSION_SAVED_EVENT = 'build_version_saved';
export const BUILD_PREVIEW_UPDATES_JOIN_EVENT = 'build_preview_updates_join';
export const BUILD_PREVIEW_UPDATES_LEAVE_EVENT = 'build_preview_updates_leave';

// A viewer who has not touched the page for this long is watching, not
// playing, so the preview reloads by itself. 20 s covers the usual pauses
// inside a play session (reading a screen, thinking about a move) without
// making someone who is only watching wait long for the new version; an app
// without Twinkle.app.lifecycle starts over on a reload, so erring towards
// "active" (the pill) is the safe side.
export const PREVIEW_IDLE_WINDOW_MS = 20_000;
// Rapid saves (an agent saving every few seconds) reload at most once per
// this gap; the reload after the gap loads whatever is newest by then.
export const PREVIEW_RELOAD_MIN_GAP_MS = 4_000;

export interface BuildVersionSaved {
  buildId: number;
  artifactVersionId: number | null;
  filesHash: string;
  serverTime: number;
}

export function parseBuildVersionSaved(
  event: unknown,
  buildId: number
): BuildVersionSaved | null {
  if (!event || typeof event !== 'object') return null;
  const value = event as Record<string, unknown>;
  if (Number(value.buildId) !== buildId || !(buildId > 0)) return null;
  const filesHash = typeof value.filesHash === 'string' ? value.filesHash : '';
  if (!/^[0-9a-f]{16,128}$/.test(filesHash)) return null;
  const serverTime = Number(value.serverTime);
  const versionId = Number(value.artifactVersionId);
  return {
    buildId,
    artifactVersionId:
      Number.isSafeInteger(versionId) && versionId > 0 ? versionId : null,
    filesHash,
    serverTime: Number.isFinite(serverTime) ? serverTime : 0
  };
}

// Is the viewer using the app right now? The app runs in a sandboxed frame
// whose input the page cannot see, so: any input on the page itself within
// the idle window, or the app frame holding focus while this browser window
// is focused (someone clicked into the app and is still on this window).
// A focused terminal or editor (the CLI saving next to the preview) leaves
// the browser window unfocused, which counts as watching.
export function isViewerActive({
  now,
  lastInteractionAt,
  pageVisible,
  windowFocused,
  frameFocused
}: {
  now: number;
  lastInteractionAt: number;
  pageVisible: boolean;
  windowFocused: boolean;
  frameFocused: boolean;
}) {
  if (!pageVisible) return false;
  if (windowFocused && frameFocused) return true;
  return lastInteractionAt > 0 && now - lastInteractionAt < PREVIEW_IDLE_WINDOW_MS;
}

export type PreviewFollowStep =
  | { kind: 'none' }
  | { kind: 'pill' }
  | { kind: 'reload'; inMs: number };

// What to do about a save the page does not show yet.
export function decidePreviewFollowStep({
  pending,
  reloading,
  active,
  now,
  lastReloadAt
}: {
  pending: boolean;
  reloading: boolean;
  active: boolean;
  now: number;
  lastReloadAt: number;
}): PreviewFollowStep {
  if (!pending || reloading) return { kind: 'none' };
  if (active) return { kind: 'pill' };
  const inMs =
    lastReloadAt > 0
      ? Math.max(0, lastReloadAt + PREVIEW_RELOAD_MIN_GAP_MS - now)
      : 0;
  return { kind: 'reload', inMs };
}
