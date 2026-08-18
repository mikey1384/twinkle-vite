const BUILD_APP_AI_USAGE_POLICY_KEYS = [
  'dayIndex',
  'dayKey',
  'baseEnergyUnitsPerDay',
  'energyLimit',
  'energyUsed',
  'energyCharged',
  'energyOverflow',
  'energyRemaining',
  'energyPercent',
  'energySegments',
  'energySegmentsRemaining',
  'energyUnitsPerSegment',
  'lowEnergyUsed',
  'currentMode',
  'lastUsageOverflowed'
] as const;

export function getBuildAppAiUsagePolicy(policy: unknown) {
  if (!policy || typeof policy !== 'object' || Array.isArray(policy)) {
    return null;
  }
  const source = policy as Record<string, unknown>;
  return BUILD_APP_AI_USAGE_POLICY_KEYS.reduce<Record<string, unknown>>(
    (result, key) => {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        result[key] = source[key];
      }
      return result;
    },
    {}
  );
}

export function sanitizeBuildAppAiUsagePolicyPayload<T>(payload: T): T {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return payload;
  }
  const source = payload as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(source, 'aiUsagePolicy')) {
    return payload;
  }
  return {
    ...source,
    aiUsagePolicy: getBuildAppAiUsagePolicy(source.aiUsagePolicy)
  } as unknown as T;
}
