import { Dispatch } from '~/types';

export default function NotiActions(dispatch: Dispatch) {
  return {
    onChangeSocketStatus(connected: boolean) {
      return dispatch({
        type: 'CHANGE_SOCKET_STATUS',
        connected
      });
    },
    onCheckVersion(data: object) {
      return dispatch({
        type: 'CHECK_VERSION',
        data
      });
    },
    onCollectRewards(userId: number) {
      return dispatch({
        type: 'COLLECT_REWARDS',
        userId
      });
    },
    onLoadNotifications({
      currentChatSubject,
      loadMoreNotifications,
      notifications,
      userId
    }: {
      currentChatSubject: string;
      loadMoreNotifications: boolean;
      notifications: object[];
      userId: number;
    }) {
      return dispatch({
        type: 'LOAD_NOTIFICATIONS',
        currentChatSubject,
        loadMoreNotifications,
        notifications,
        userId
      });
    },
    onLoadRewards({
      rewards,
      loadMoreRewards,
      totalRewardedTwinkles,
      totalRewardedTwinkleCoins,
      userId
    }: {
      rewards: object[];
      loadMoreRewards: boolean;
      totalRewardedTwinkles: number;
      totalRewardedTwinkleCoins: number;
      userId: number;
    }) {
      return dispatch({
        type: 'LOAD_REWARDS',
        rewards,
        loadMoreRewards,
        totalRewardedTwinkles,
        totalRewardedTwinkleCoins,
        userId
      });
    },
    onGetRanks({
      all,
      top30s,
      allMonthly,
      top30sMonthly,
      myMonthlyRank,
      myAllTimeRank,
      myAllTimeXP,
      myMonthlyXP
    }: {
      all: object[];
      top30s: object[];
      allMonthly: object[];
      top30sMonthly: object[];
      myMonthlyRank: number;
      myAllTimeRank: number;
      myAllTimeXP: number;
      myMonthlyXP: number;
    }) {
      return dispatch({
        type: 'LOAD_RANKS',
        all,
        top30s,
        allMonthly,
        top30sMonthly,
        myMonthlyRank,
        myAllTimeRank,
        myAllTimeXP,
        myMonthlyXP
      });
    },
    onIncreaseNumNewNotis() {
      return dispatch({
        type: 'INCREASE_NUM_NEW_NOTIS'
      });
    },
    onIncreaseNumNewPosts() {
      return dispatch({
        type: 'INCREASE_NUM_NEW_POSTS'
      });
    },
    onLoadMoreNotifications({
      loadMoreNotifications,
      notifications,
      userId
    }: {
      loadMoreNotifications: boolean;
      notifications: object[];
      userId: number;
    }) {
      return dispatch({
        type: 'LOAD_MORE_NOTIFICATIONS',
        loadMoreNotifications,
        notifications,
        userId
      });
    },
    onLoadMoreRewards({ userId, data }: { userId: number; data: object }) {
      return dispatch({
        type: 'LOAD_MORE_REWARDS',
        data,
        userId
      });
    },
    onNotifyChatSubjectChange(subject: object) {
      return dispatch({
        type: 'CHAT_SUBJECT_CHANGE',
        subject
      });
    },
    onResetNumNewPosts() {
      return dispatch({
        type: 'RESET_NUM_NEW_POSTS'
      });
    },
    onResetTodayStats() {
      return dispatch({
        type: 'RESET_TODAY_STATS'
      });
    },
    onSetDailyRewardModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_DAILY_REWARD_MODAL_SHOWN',
        shown
      });
    },
    onSetDailyBonusModalShown(shown: boolean) {
      return dispatch({
        type: 'SET_DAILY_BONUS_MODAL_SHOWN',
        shown
      });
    },
    onShowUpdateNotice(shown: boolean) {
      return dispatch({
        type: 'SHOW_UPDATE_NOTICE',
        shown
      });
    },
    onUpdateTodayStats({ newStats }: { newStats: object }) {
      return dispatch({
        type: 'UPDATE_TODAY_STATS',
        newStats
      });
    }
  };
}
