// These fields travel together in full profiles. Compact content identities may
// omit them; an explicit null, however, is a canonical removal, not a fallback.
export const PROFILE_APPEARANCE_FIELDS = [
  'profileTheme',
  'profileCoverUrl',
  'profileCoverPosition',
  'profileCoverShine'
] as const;

export const PROFILE_APPEARANCE_MAX_AGE_MS = 60_000;

type ProfileState = Record<string, any>;
const responseTimes = new WeakMap<
  ProfileState,
  { loadedAt: number; requestedAt: number }
>();

export function withLoadedProfileAppearance(
  profile: ProfileState,
  requestedAt: number,
  now = Date.now()
) {
  if (!profile?.id) return profile;
  // The request scheduler coalesces simultaneous GETs into the same response
  // object. Every consumer must retain the original read's age, even if a
  // later consumer joined it after a cover mutation completed.
  const timing = responseTimes.get(profile) || { loadedAt: now, requestedAt };
  responseTimes.set(profile, timing);
  return {
    ...profile,
    profileTheme: profile.profileTheme || 'logoBlue',
    // Older API versions omitted null cover fields even on full profiles.
    profileCoverUrl: profile.profileCoverUrl ?? null,
    profileCoverPosition: profile.profileCoverPosition ?? null,
    profileCoverShine: profile.profileCoverShine ?? true,
    profileAppearanceLoadedAt: timing.loadedAt,
    profileAppearanceRequestStartedAt: timing.requestedAt
  };
}

export function isProfileAppearanceFresh(loadedAt: number, now = Date.now()) {
  return (
    Number.isFinite(loadedAt) &&
    loadedAt > 0 &&
    now >= loadedAt &&
    now - loadedAt < PROFILE_APPEARANCE_MAX_AGE_MS
  );
}

export function resolveProfileAppearance(
  supplied: ProfileState,
  cached: ProfileState
) {
  return Object.fromEntries(
    PROFILE_APPEARANCE_FIELDS.map((field) => [
      field,
      cached[field] !== undefined ? cached[field] : supplied[field]
    ])
  );
}

export function reconcileProfileAppearancePatch(
  previous: ProfileState,
  incoming: ProfileState | null,
  now = Date.now()
) {
  if (!incoming) return incoming;
  const requestedAt = incoming.profileAppearanceRequestStartedAt;
  if (Number.isFinite(requestedAt)) {
    // A profile read started before a saved change must not undo that change.
    // Also reject an older read that completes after a more recent read.
    if (
      requestedAt <= (previous.profileAppearanceChangedAt || 0) ||
      requestedAt < (previous.profileAppearanceRequestStartedAt || 0)
    ) {
      const patch = { ...incoming };
      for (const field of PROFILE_APPEARANCE_FIELDS) delete patch[field];
      delete patch.profileAppearanceLoadedAt;
      delete patch.profileAppearanceRequestStartedAt;
      return patch;
    }
    return incoming;
  }
  if (PROFILE_APPEARANCE_FIELDS.some((field) => incoming[field] !== undefined)) {
    return { ...incoming, profileAppearanceChangedAt: now };
  }
  return incoming;
}
