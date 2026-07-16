export interface HomeFeedResponseCursor {
  feedId: number;
  lastRewardLevel: number;
  lastTimeStamp: number;
  lastViewDuration: number;
}

export interface HomeFeedPaginationCursor extends HomeFeedResponseCursor {
  scopeKey: string;
}

export interface HomeFeedPage {
  feeds: any[];
  loadMoreButton: boolean;
  nextCursor?: HomeFeedResponseCursor | null;
}
