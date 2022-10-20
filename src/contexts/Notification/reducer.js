export default function NotiReducer(state, action) {
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
    case 'CLEAR_REWARDS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            rewards: []
          }
        }
      };
    case 'COLLECT_REWARDS':
      return {
        ...state,
        notiObj: {
          ...state.notiObj,
          [action.userId]: {
            ...state.notiObj[action.userId],
            totalRewardedTwinkles: 0,
            totalRewardedTwinkleCoins: 0,
            loadMoreRewards: false
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
    case 'SHOW_UPDATE_NOTICE':
      return {
        ...state,
        updateNoticeShown: action.shown
      };
    case 'UPDATE_TODAY_STATS':
      return {
        ...state,
        todayStats: {
          ...state.todayStats,
          nextMission: action.nextMission,
          xpEarned: action.xpEarned,
          coinsEarned: action.coinsEarned,
          loaded: true
        }
      };
    default:
      return state;
  }
}
