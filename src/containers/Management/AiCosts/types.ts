import React from 'react';

export type RangeOption = 1 | 7 | 30 | 90;
export type AiEnergyManualIdentityMatchType =
  | 'email'
  | 'user'
  | 'risk_key'
  | 'ip';
export type AiEnergyManualIdentityRecommendationType =
  | 'email'
  | 'user'
  | 'risk_key';

export interface AiCostSummary {
  accountCount?: number;
  eventCount: number;
  requestCount: number;
  estimatedCostUsd: number;
  inputTokens: number;
  cachedInputTokens: number;
  cacheEligibleInputTokens: number;
  outputTokens: number;
  totalTokens: number;
  imageCount: number;
  audioSeconds: number;
  energyUnits: number;
  energyChargedUnits: number;
  energyOverflowUnits: number;
  coinCharged: number;
}

export interface AiCostRow extends Partial<AiCostSummary> {
  id?: number;
  eventId?: number;
  source?: string;
  sourceRank?: number;
  dayIndex?: number;
  dayKey?: string;
  userId?: number;
  username?: string;
  identityKey?: string;
  accountVerifiedEmail?: string;
  verifiedEmail?: string;
  provider?: string;
  model?: string;
  surface?: string;
  operation?: string;
  billingPolicy?: string;
  targetType?: string;
  targetId?: number | string;
  accountCount?: number;
  userIds?: string;
  identities?: string;
  riskKeyType?: string;
  riskKeyHash?: string;
  eventType?: string;
  firstVerifiedEmail?: string;
  deviceId?: string;
  reqIp?: string;
  reqIpPrefix?: string;
  reqIpIsPrivate?: number;
  forwardedIpPrefix?: string;
  forwardedIpIsPrivate?: number;
  socketRemoteIp?: string;
  socketRemoteIpPrefix?: string;
  socketRemoteIpIsPrivate?: number;
  userAgentHash?: string;
  sharedRiskKeyTypes?: string;
  sharedRiskKeyHashes?: string;
  sharedRiskKeys?: string;
  manualIdentityKey?: string;
  bucketId?: number;
  bucketLabel?: string;
  matchType?: AiEnergyManualIdentityMatchType;
  matchValue?: string;
  recommendationType?: AiEnergyManualIdentityRecommendationType;
  email?: string;
  label?: string;
  reason?: string;
  evidenceCount?: number;
  confidenceScore?: number;
  note?: string;
  disabledAt?: number;
  createdAt?: number;
}

export interface AiEnergyManualIdentityRule {
  id: number;
  bucketId: number;
  bucketLabel?: string;
  manualIdentityKey: string;
  matchType: AiEnergyManualIdentityMatchType;
  matchValue: string;
  riskKeyType?: string;
  riskKeyHash?: string;
  note?: string;
  createdBy?: number;
  disabledBy?: number;
  createdAt?: number;
  updatedAt?: number;
  disabledAt?: number;
  userId?: number;
  username?: string;
  accountVerifiedEmail?: string;
}

export interface AiEnergyManualIdentityBucket {
  id: number;
  label: string;
  manualIdentityKey: string;
  note?: string;
  isBanned?: boolean;
  banMessage?: string;
  bannedBy?: number;
  bannedAt?: number;
  createdBy?: number;
  createdAt?: number;
  updatedAt?: number;
  disabledAt?: number;
  rules: AiEnergyManualIdentityRule[];
}

export interface AiEnergyManualIdentityRecommendation {
  recommendationType: AiEnergyManualIdentityRecommendationType;
  userId?: number;
  username?: string;
  email?: string;
  riskKeyType?: string;
  riskKeyHash?: string;
  label?: string;
  reason?: string;
  evidenceCount: number;
  confidenceScore: number;
}

export interface AiEnergyManualIdentityRawSignal {
  riskKeyType: string;
  riskKeyValue: string;
  label: string;
}

export type AiEnergyManualIdentityBucketAction =
  | {
      actionType: 'event_row';
      row: AiCostRow;
    }
  | {
      actionType: 'user';
      row: AiCostRow;
    }
  | {
      actionType: 'email';
      row: AiCostRow;
    }
  | {
      actionType: 'risk_key';
      row: AiCostRow;
    }
  | {
      actionType: 'raw_signal';
      signal: AiEnergyManualIdentityRawSignal;
    };

export interface AiEnergyManualIdentityRecommendations {
  accounts: AiEnergyManualIdentityRecommendation[];
  emails: AiEnergyManualIdentityRecommendation[];
  riskKeys: AiEnergyManualIdentityRecommendation[];
}

export interface AiCostEventCursor {
  createdAt: number;
  sourceRank: number;
  eventId: number;
}

export interface AiCostEventPage {
  events: AiCostRow[];
  nextCursor: AiCostEventCursor | null;
  hasMore: boolean;
  pageSize: number;
}

export interface AiCostReport {
  days: number;
  startDayIndex: number;
  endDayIndex: number;
  generatedAt: number;
  summary: AiCostSummary;
  byDay: AiCostRow[];
  bySurface: AiCostRow[];
  byProviderModel: AiCostRow[];
  byBillingPolicy: AiCostRow[];
  topAccounts: AiCostRow[];
  topIdentities: AiCostRow[];
  topRiskGroups: AiCostRow[];
  recentEvents: AiCostRow[];
  recentEventsCursor: AiCostEventCursor | null;
  recentEventsHasMore: boolean;
  recentEventsPageSize: number;
  recentSessionEvidence: AiCostRow[];
}

export interface AiCostRiskGroupDetail {
  days: number;
  startDayIndex: number;
  endDayIndex: number;
  generatedAt: number;
  riskKeyType: string;
  riskKeyHash: string;
  summary: AiCostSummary & {
    riskKeyType?: string;
    riskKeyHash?: string;
  };
  accounts: AiCostRow[];
  sessionEvidence: AiCostRow[];
  events: AiCostRow[];
  eventsCursor: AiCostEventCursor | null;
  eventsHasMore: boolean;
  eventsPageSize: number;
}

export interface DataTableColumn {
  key: keyof AiCostRow;
  label: string;
  align?: 'left' | 'right';
  render?: (value: unknown, row: AiCostRow) => React.ReactNode;
}
