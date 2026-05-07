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

function getBuildContributionInviteMembershipKey(invite: any) {
  const buildId = Number(invite?.buildId || 0);
  const userId = Number(invite?.userId || 0);
  return buildId > 0 && userId > 0 ? `${buildId}:${userId}` : '';
}

function nullableNumber(value: any) {
  if (value === null || typeof value === 'undefined' || value === '') {
    return null;
  }
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function buildContributionInviteMatches({
  actionObj,
  invite,
  inviteId,
  status
}: {
  actionObj: Record<string, any>;
  invite?: Record<string, any> | null;
  inviteId: number;
  status?: 'pending' | 'accepted' | 'declined' | 'revoked';
}) {
  if (Number(actionObj.id || 0) === inviteId) return true;
  const acceptedMembership =
    status === 'accepted' || Number(invite?.acceptedAt || 0) > 0;
  if (!acceptedMembership) return false;
  const currentMembershipKey =
    getBuildContributionInviteMembershipKey(actionObj);
  const updatedMembershipKey = getBuildContributionInviteMembershipKey(invite);
  return Boolean(
    currentMembershipKey && currentMembershipKey === updatedMembershipKey
  );
}

function updateBuildContributionInviteNotification(
  state: any,
  {
    invite,
    inviteId,
    status
  }: {
    invite?: Record<string, any> | null;
    inviteId: number;
    status?: 'pending' | 'accepted' | 'declined' | 'revoked';
  }
) {
  const resolvedInviteId = Number(invite?.id || inviteId || 0);
  if (!resolvedInviteId || !state?.notiObj) return state;

  const hasAcceptedAt = Object.prototype.hasOwnProperty.call(
    invite || {},
    'acceptedAt'
  );
  const hasDeclinedAt = Object.prototype.hasOwnProperty.call(
    invite || {},
    'declinedAt'
  );
  const hasRevokedAt = Object.prototype.hasOwnProperty.call(
    invite || {},
    'revokedAt'
  );
  const invitePatch = {
    ...(invite?.buildId ? { buildId: Number(invite.buildId) } : {}),
    ...(invite?.userId ? { userId: Number(invite.userId) } : {}),
    acceptedAt: hasAcceptedAt
      ? Number(invite?.acceptedAt || 0)
      : status === 'accepted'
        ? 1
        : 0,
    declinedAt: hasDeclinedAt
      ? Number(invite?.declinedAt || 0)
      : status === 'declined'
        ? 1
        : 0,
    revokedAt: hasRevokedAt
      ? Number(invite?.revokedAt || 0)
      : status === 'revoked'
        ? 1
        : 0
  };
  let changed = false;
  const nextNotiObj: Record<string, any> = { ...state.notiObj };

  for (const [userId, notiState] of Object.entries<any>(state.notiObj)) {
    const notifications = Array.isArray(notiState?.notifications)
      ? notiState.notifications
      : null;
    if (!notifications) continue;

    let notificationsChanged = false;
    const nextNotifications = notifications.map((notification: any) => {
      const actionObj = notification?.actionObj || {};
      if (
        actionObj.contentType !== 'buildContributionInvite' ||
        !buildContributionInviteMatches({
          actionObj,
          invite,
          inviteId: resolvedInviteId,
          status
        })
      ) {
        return notification;
      }
      const actionInviteId = Number(actionObj.id || 0);
      const nextActionObj = {
        ...actionObj,
        ...invitePatch,
        id: actionInviteId || resolvedInviteId
      };
      if (shallowEqualObject(actionObj, nextActionObj)) {
        return notification;
      }
      notificationsChanged = true;
      return {
        ...notification,
        actionObj: nextActionObj
      };
    });

    if (notificationsChanged) {
      changed = true;
      nextNotiObj[userId] = {
        ...notiState,
        notifications: nextNotifications
      };
    }
  }

  if (!changed) return state;
  return {
    ...state,
    notiObj: nextNotiObj
  };
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
    case 'UPDATE_BUILD_CONTRIBUTION_INVITE_NOTIFICATION':
      return updateBuildContributionInviteNotification(state, {
        invite: action.invite,
        inviteId: action.inviteId,
        status: action.status
      });
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
        rankingsLoaded: true,
        rankingsTwinkleXP:
          nullableNumber(action.rankingsTwinkleXP) ??
          nullableNumber(action.myAllTimeXP),
        rankingsUserId: Number(action.userId || 0) || null
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
