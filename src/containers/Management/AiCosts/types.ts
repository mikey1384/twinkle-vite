import React from 'react';

export type RangeOption = 1 | 7 | 30 | 90;

export interface AiCostSummary {
  accountCount?: number;
  eventCount: number;
  requestCount: number;
  estimatedCostUsd: number;
  inputTokens: number;
  cachedInputTokens: number;
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
  createdAt?: number;
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
