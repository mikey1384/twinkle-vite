import type { TradeBuild } from '~/components/Build/TradeBuilds';

export interface TradeBundle {
  coins: number;
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
}
