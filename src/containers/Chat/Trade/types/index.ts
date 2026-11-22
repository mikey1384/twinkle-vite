import type { TradeBuild } from '~/components/Build/TradeBuilds';

export interface TradeBundle {
  coins: number;
  // AI Energy battery units (server units; shown as % of a battery)
  battery?: number;
  cardIds: number[];
  groupIds: number[];
  builds: TradeBuild[];
  burnSummary?: { xp: number; unknownCount: number };
  cards?: any[];
  groups?: any[];
}

export interface TradeTerms {
  give: TradeBundle;
  receive: TradeBundle;
}

export interface TradeReview {
  terms: TradeTerms;
  mode: 'trade' | 'send' | 'show' | 'request' | 'accept';
  coinExplanation?: string;
  // when the battery in these terms ends (unix seconds); today's end if unset
  batteryExpiresAt?: number;
}
