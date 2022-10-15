export default function NotiActions(dispatch) {
  return {
    onChangeSocketStatus(connected) {
      return dispatch({
        type: 'CHANGE_SOCKET_STATUS',
        connected
      });
    },
    onCheckVersion(data) {
      return dispatch({
        type: 'CHECK_VERSION',
        data
      });
    },
    onClearRewards(userId) {
      return dispatch({
        type: 'CLEAR_REWARDS',
        userId
      });
    },
    onCollectRewards(userId) {
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
    onLoadMoreNotifications({ loadMoreNotifications, notifications, userId }) {
      return dispatch({
        type: 'LOAD_MORE_NOTIFICATIONS',
        loadMoreNotifications,
        notifications,
        userId
      });
    },
    onLoadMoreRewards({ userId, data }) {
      return dispatch({
        type: 'LOAD_MORE_REWARDS',
        data,
        userId
      });
    },
    onNotifyChatSubjectChange(subject) {
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
    onShowUpdateNotice(shown) {
      return dispatch({
        type: 'SHOW_UPDATE_NOTICE',
        shown
      });
    },
    onUpdateTodayStats({ xpEarned, coinsEarned }) {
      return dispatch({
        type: 'UPDATE_TODAY_STATS',
        xpEarned,
        coinsEarned
      });
    }
  };
}
