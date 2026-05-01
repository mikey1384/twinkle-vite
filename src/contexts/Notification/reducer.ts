function mergeAiUsagePolicy(
  prevPolicy: Record<string, any> | null | undefined,
  nextPolicy: Record<string, any> | null | undefined
) {
  if (!nextPolicy) return nextPolicy;
  const hasCommunityEligibility = Object.prototype.hasOwnProperty.call(
    nextPolicy,
    'communityFundResetEligibility'
  );
  if (
    prevPolicy?.communityFundResetEligibility &&
    !hasCommunityEligibility &&
    (!nextPolicy.dayIndex || nextPolicy.dayIndex === prevPolicy.dayIndex)
  ) {
    return {
      ...nextPolicy,
      communityFundResetEligibility: prevPolicy.communityFundResetEligibility
    };
  }
  return nextPolicy;
}

function mergeTodayStats(
  state: any,
  newStats: Record<string, any>,
  {
    loaded,
    loading
  }: {
    loaded?: boolean;
    loading?: boolean;
  } = {}
) {
  const nextAiUsagePolicy =
    'aiUsagePolicy' in newStats
      ? mergeAiUsagePolicy(state.todayStats.aiUsagePolicy, newStats.aiUsagePolicy)
      : state.todayStats.aiUsagePolicy;
  const nextTodayStats = {
    ...state.todayStats,
    ...newStats,
    ...('aiUsagePolicy' in newStats
      ? { aiUsagePolicy: nextAiUsagePolicy }
      : {}),
    ...(typeof loaded === 'boolean' ? { loaded } : {}),
    ...(typeof loading === 'boolean' ? { loading } : {})
  };
  if (shallowEqualObject(state.todayStats, nextTodayStats)) {
    return state;
  }
  return {
    ...state,
    todayStats: nextTodayStats
  };
}

function shallowEqualObject(
  prev: Record<string, any> | null | undefined,
  next: Record<string, any> | null | undefined
) {
  if (Object.is(prev, next)) return true;
  if (!prev || !next) return false;
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  if (prevKeys.length !== nextKeys.length) return false;
  return prevKeys.every((key) => Object.is(prev[key], next[key]));
}

export default function NotiReducer(
  state: any,
  action: {
    type: string;
    [key: string]: any;
  }
) {
  switch (action.type) {
    case 'CHANGE_SOCKET_STATUS':
      return {
        ...state,
        socketConnected: action.connected
      };
    case 'CHAT_SUBJECT_CHANGE':
      return {
        ...state,
        currentChatSubject: {
          ...state.currentChatSubject,
          ...action.subject
        }
      };
    case 'CHECK_VERSION':
      return {
        ...state,
        versionMatch: action.data.match,
        updateDetail: action.data.updateDetail
      };
    case 'COLLECT_REWARDS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            totalRewardedTwinkles: 0,
            totalRewardedTwinkleCoins: 0
          }
        }
      };
    case 'INCREASE_NUM_NEW_NOTIS':
      return {
        ...state,
        numNewNotis: state.numNewNotis + 1
      };
    case 'INCREASE_NUM_NEW_POSTS':
      return {
        ...state,
        numNewPosts: state.numNewPosts + 1
      };
    case 'SET_NUM_NEW_POSTS':
      return {
        ...state,
        numNewPosts: Math.max(0, Number(action.numNewPosts || 0))
      };
    case 'LOAD_MORE_NOTIFICATIONS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            notifications: (
              state.notiObj[action.userId]?.notifications || []
            ).concat(action.notifications),
            loadMore: action.loadMoreNotifications
          }
        }
      };
    case 'LOAD_NOTIFICATIONS':
      return {
        ...state,
        currentChatSubject: action.currentChatSubject,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            notifications: action.notifications,
            loadMore: action.loadMoreNotifications
          }
        },
        numNewNotis: 0,
        notificationsLoaded: true
      };
    case 'LOAD_REWARDS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            rewards: action.rewards,
            totalRewardedTwinkles: action.totalRewardedTwinkles,
            totalRewardedTwinkleCoins: action.totalRewardedTwinkleCoins,
            loadMoreRewards: action.loadMoreRewards
          }
        }
      };
    case 'LOAD_MORE_REWARDS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            rewards: state.notiObj[action.userId].rewards.concat(
              action.data.rewards
            ),
            loadMoreRewards: action.data.loadMore
          }
        }
      };
    case 'LOAD_RANKS':
      return {
        ...state,
        allRanks: action.all,
        top30s: action.top30s,
        allMonthly: action.allMonthly,
        top30sMonthly: action.top30sMonthly,
        myMonthlyRank: action.myMonthlyRank,
        myAllTimeRank: action.myAllTimeRank,
        myAllTimeXP: action.myAllTimeXP,
        myMonthlyXP: action.myMonthlyXP,
        rankingsLoaded: true
      };
    case 'RESET_NUM_NEW_POSTS':
      return {
        ...state,
        numNewPosts: 0
      };
    case 'SET_DAILY_REWARD_MODAL_SHOWN':
      return {
        ...state,
        dailyRewardModalShown: action.shown
      };
    case 'SET_DAILY_BONUS_MODAL_SHOWN':
      return {
        ...state,
        dailyBonusModalShown: action.shown
      };
    case 'SET_REWARDS_TIMEOUT_EXECUTED':
      return {
        ...state,
        rewardsTimeoutExecuted: action.executed
      };
    case 'SHOW_UPDATE_NOTICE':
      return {
        ...state,
        updateNoticeShown: action.shown
      };
    case 'UPDATE_TODAY_STATS':
      return mergeTodayStats(state, action.newStats);
    case 'APPLY_TODAY_STATS_PROGRESS':
      // Canonical progress patches can unlock Today Stats rendering before
      // the full /notification/today hydrate finishes.
      return mergeTodayStats(state, action.newStats, { loaded: true });
    case 'HYDRATE_TODAY_STATS':
      return mergeTodayStats(state, action.todayStats, {
        loaded: true,
        loading: false
      });
    case 'SET_TODAY_STATS_LOADING':
      return mergeTodayStats(state, {}, { loading: action.loading });
    case 'RESET_TODAY_STATS':
      return {
        ...state,
        todayStats: {
          aiCallDuration: 0,
          aiUsagePolicy: null,
          myAchievementsObj: {},
          achievedDailyGoals: [],
          dailyTaskStatus: null,
          dailyTaskStreak: 0,
          dailyTaskBestStreak: 0,
          dailyQuestionCompleted: false,
          loaded: false,
          loading: true,
          xpEarned: 0,
          coinsEarned: 0,
          showXPRankings: false,
          todayXPRankingLoaded: false,
          todayXPRanking: [],
          todayXPRankingHasMore: false
        }
      };
    default:
      return state;
  }
}
