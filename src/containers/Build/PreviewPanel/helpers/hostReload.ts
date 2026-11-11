// `host:reload`: the app frame's SDK asks this page to reload itself.
//
// The SDK inside an app frame is served by the API, so it is always the
// newest; this page is whatever the tab loaded, maybe days ago. When the SDK
// sends a request this page does not know, the bridge answers
// `host_update_required`, and the SDK draws "Twinkle was updated. Reload this
// page to keep playing." inside the frame (twinkle-api hostUpdateScript.ts).
// The frame's sandbox cannot navigate the top page, so its Reload button asks
// here. `{ check: true }` only asks whether this page knows the message (a
// page from before this file answers `host_update_required` and the SDK shows
// plain reload instructions instead of a button).
//
// A reload is only given when this page has itself found that it is out of
// date (it refused a request as unknown, or a newer website build is armed),
// and only from the player's own tap: an app cannot reload Twinkle on a whim.

let hostUpdateRequired = false;

/** The bridge refused a request type it does not know. */
export function noteHostUpdateRequired() {
  hostUpdateRequired = true;
}

export function wasHostUpdateRequired() {
  return hostUpdateRequired;
}

/** tests */
export function resetHostUpdateRequired() {
  hostUpdateRequired = false;
}

// `host:supports`: the SDK asks whether this page carries a feature that
// rides on messages it already knows (a new field an older page would drop
// without a word). A page that does not know the feature, or this message,
// answers `host_update_required`, so the SDK tells the player to reload
// instead of sending a call that would lose the field.
//  - land-terrain (11-10): world.join's land.terrain and land:edit's terrain
//    reach the server (buildRuntimeLand.ts).
const HOST_FEATURES = new Set(['land-terrain']);
export function hostSupportsFeature(feature: unknown) {
  return typeof feature === 'string' && HOST_FEATURES.has(feature);
}

export type HostReloadDecision =
  | { allowed: true; reload: boolean; response: Record<string, boolean> }
  | { allowed: false; code: string; message: string };

export function decideHostReload({
  check,
  hostUpdateRequired: required,
  updatePending,
  userActivation
}: {
  check: boolean;
  hostUpdateRequired: boolean;
  updatePending: boolean;
  // navigator.userActivation; missing in older browsers
  userActivation: { isActive?: boolean } | null | undefined;
}): HostReloadDecision {
  if (check) {
    return { allowed: true, reload: false, response: { canReload: true } };
  }
  if (!required && !updatePending) {
    return {
      allowed: false,
      code: 'host_reload_not_needed',
      message: 'This page is up to date'
    };
  }
  // A browser without the activation API cannot say; the page already knows
  // it is out of date, so the request is honoured there.
  if (userActivation && userActivation.isActive !== true) {
    return {
      allowed: false,
      code: 'USER_ACTIVATION_REQUIRED',
      message: 'The page can only be reloaded from a user action'
    };
  }
  return { allowed: true, reload: true, response: { reloading: true } };
}
