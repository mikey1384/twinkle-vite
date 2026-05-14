type AiUsagePolicyRecord = Record<string, any>;

export function areAiUsagePoliciesEqual(
  previousPolicy: unknown,
  nextPolicy: unknown
) {
  return areAiUsagePolicyValuesEqual(previousPolicy, nextPolicy);
}

export function mergeAiUsagePolicyWithCurrent<
  T extends AiUsagePolicyRecord | null | undefined
>(currentPolicy: T, nextPolicy: T): T {
  if (!nextPolicy) return nextPolicy;

  const shouldCarryCommunityEligibility =
    !!currentPolicy?.communityFundResetEligibility &&
    !nextPolicy.communityFundResetEligibility &&
    (nextPolicy.dayIndex == null ||
      nextPolicy.dayIndex === currentPolicy.dayIndex);

  const mergedPolicy = shouldCarryCommunityEligibility
    ? {
        ...nextPolicy,
        communityFundResetEligibility:
          currentPolicy.communityFundResetEligibility
      }
    : nextPolicy;

  if (areAiUsagePoliciesEqual(currentPolicy, mergedPolicy)) {
    return currentPolicy;
  }

  return mergedPolicy as T;
}

function areAiUsagePolicyValuesEqual(
  previousValue: any,
  nextValue: any
): boolean {
  if (Object.is(previousValue, nextValue)) return true;
  if (previousValue == null || nextValue == null) return false;
  if (typeof previousValue !== typeof nextValue) return false;

  if (Array.isArray(previousValue) || Array.isArray(nextValue)) {
    if (!Array.isArray(previousValue) || !Array.isArray(nextValue)) {
      return false;
    }
    if (previousValue.length !== nextValue.length) return false;
    return previousValue.every((value, index) =>
      areAiUsagePolicyValuesEqual(value, nextValue[index])
    );
  }

  if (typeof previousValue === 'object') {
    const previousKeys = Object.keys(previousValue);
    const nextKeys = Object.keys(nextValue);
    if (previousKeys.length !== nextKeys.length) return false;
    return previousKeys.every((key) =>
      Object.prototype.hasOwnProperty.call(nextValue, key) &&
      areAiUsagePolicyValuesEqual(previousValue[key], nextValue[key])
    );
  }

  return false;
}
