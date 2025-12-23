import React, { useReducer, ReactNode, useMemo } from 'react';
import { createContext } from 'use-context-selector';
import NotiActions from './actions';
import NotiReducer from './reducer';

export const NotiContext = createContext({});
export const initialNotiState = {
  versionMatch: true,
  notiObj: {},
  rewards: [],
  currentChatSubject: {},
  loadMoreRewards: false,
  numNewNotis: 0,
  numNewPosts: 0,
  rankingsLoaded: false,
  notificationsLoaded: false,
  allRanks: [],
  allMonthly: [],
  dailyRewardModalShown: false,
  myAllTimeRank: null,
  myMonthlyRank: null,
  myAllTimeXP: 0,
  myMonthlyXP: 0,
  rewardsTimeoutExecuted: false,
  top30s: [],
  top30sMonthly: [],
  socketConnected: false,
	  todayStats: {
	    aiCallDuration: 0,
	    myAchievementsObj: {},
	    achievedDailyGoals: [],
	    dailyQuestionCompleted: false,
	    loaded: false,
	    xpEarned: 0,
	    coinsEarned: 0,
	    showXPRankings: false,
    todayXPRankingLoaded: false,
    todayXPRanking: [],
    todayXPRankingHasMore: false
  },
  updateDetail: '',
  updateNoticeShown: false
};

export function NotiContextProvider({ children }: { children: ReactNode }) {
  const [notiState, notiDispatch] = useReducer(NotiReducer, initialNotiState);
  const memoizedActions = useMemo(
    () => NotiActions(notiDispatch),
    [notiDispatch]
  );
  const contextValue = useMemo(
    () => ({ state: notiState, actions: memoizedActions }),
    [notiState, memoizedActions]
  );
  return (
    <NotiContext.Provider value={contextValue}>{children}</NotiContext.Provider>
  );
}
