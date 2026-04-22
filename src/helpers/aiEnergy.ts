const DEFAULT_AI_ENERGY_RECHARGE_COST = 1000000;

export interface CommunityFundRechargePolicy {
  resetCost?: number | null;
  communityFundRechargeCoinsRemaining?: number | null;
  communityFundResetEligibility?: {
    eligible?: boolean | null;
  } | null;
}

export function getAiEnergyRechargeCost(
  aiUsagePolicy?: CommunityFundRechargePolicy | null
) {
  return Math.max(
    1,
    Number(aiUsagePolicy?.resetCost || DEFAULT_AI_ENERGY_RECHARGE_COST)
  );
}

export function isCommunityFundRechargeAvailable({
  aiUsagePolicy,
  communityFunds,
  communityFundsKnown
}: {
  aiUsagePolicy?: CommunityFundRechargePolicy | null;
  communityFunds?: number | null;
  communityFundsKnown?: boolean | null;
}) {
  const rechargeCost = getAiEnergyRechargeCost(aiUsagePolicy);
  const communityFundBalanceKnown = communityFundsKnown !== false;
  const communityFundHasEnoughCoins =
    !communityFundBalanceKnown ||
    Math.max(0, Number(communityFunds || 0)) >= rechargeCost;
  return (
    !!aiUsagePolicy?.communityFundResetEligibility?.eligible &&
    Number(aiUsagePolicy?.communityFundRechargeCoinsRemaining || 0) >=
      rechargeCost &&
    communityFundHasEnoughCoins
  );
}

export function errorHasActualCommunityFundsBalance(error?: {
  code?: string | null;
}) {
  return (
    error?.code === 'zero_ciel_ai_usage_reset_insufficient_community_funds'
  );
}
