import { Dispatch } from '~/types';

export default function NotiActions(dispatch: Dispatch) {
  return {
    onChangeSocketStatus(connected: boolean) {
      dispatch({
        type: 'CHANGE_SOCKET_STATUS',
        connected
      });
    },
    onCheckVersion(data: object) {
      dispatch({
        type: 'CHECK_VERSION',
        data
      });
    },
    onCollectRewards(userId: number) {
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
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
      dispatch({
        type: 'INCREASE_NUM_NEW_NOTIS'
      });
    },
    onIncreaseNumNewPosts() {
      dispatch({
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
      dispatch({
        type: 'LOAD_MORE_NOTIFICATIONS',
        loadMoreNotifications,
        notifications,
        userId
      });
    },
    onLoadMoreRewards({ userId, data }: { userId: number; data: object }) {
      dispatch({
        type: 'LOAD_MORE_REWARDS',
        data,
        userId
      });
    },
    onNotifyChatSubjectChange(subject: object) {
      dispatch({
        type: 'CHAT_SUBJECT_CHANGE',
        subject
      });
    },
    onResetNumNewPosts() {
      dispatch({
        type: 'RESET_NUM_NEW_POSTS'
      });
    },
    onResetTodayStats() {
      dispatch({
        type: 'RESET_TODAY_STATS'
      });
    },
    onSetDailyRewardModalShown(shown: boolean) {
      dispatch({
        type: 'SET_DAILY_REWARD_MODAL_SHOWN',
        shown
      });
    },
    onSetDailyBonusModalShown(shown: boolean) {
      dispatch({
        type: 'SET_DAILY_BONUS_MODAL_SHOWN',
        shown
      });
    },
    onSetRewardsTimeoutExecuted(executed: boolean) {
      dispatch({
        type: 'SET_REWARDS_TIMEOUT_EXECUTED',
        executed
      });
    },
    onShowUpdateNotice(shown: boolean) {
      dispatch({
        type: 'SHOW_UPDATE_NOTICE',
        shown
      });
    },
    onUpdateTodayStats({ newStats }: { newStats: object }) {
      dispatch({
        type: 'UPDATE_TODAY_STATS',
        newStats
      });
    }
  };
}
