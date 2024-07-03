import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import MainFeeds from './MainFeeds';
import TodayStats from './TodayStats';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import Loading from '~/components/Loading';
import { container } from './Styles';
import {
  useAppContext,
  useNotiContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { scrollPositions } from '~/constants/state';
import { isMobile } from '~/helpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const newsLabel = localize('news');
const rankingsLabel = localize('rankings');

function Notification({
  className,
  location,
  style,
  trackScrollPosition
}: {
  className?: string;
  location?: string;
  style?: React.CSSProperties;
  trackScrollPosition?: boolean;
}) {
  const ContainerRef: React.RefObject<any> = useRef(null);
  const isRewardCollectedRef = useRef(false);
  const getCurrentNextDayTimeStamp = useAppContext(
    (v) => v.requestHelpers.getCurrentNextDayTimeStamp
  );
  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadRewards = useAppContext((v) => v.requestHelpers.loadRewards);
  const { userId } = useKeyContext((v) => v.myState);
  const notiObj = useNotiContext((v) => v.state.notiObj);
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onUpdateTodayStats = useNotiContext(
    (v) => v.actions.onUpdateTodayStats
  );
  const dailyRewardModalShown = useNotiContext(
    (v) => v.state.dailyRewardModalShown
  );
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const pageVisible = useViewContext((v) => v.state.pageVisible);
  const loadingNotificationRef = useRef(false);
  const rewardsTimeoutExecuted = useNotiContext(
    (v) => v.state.rewardsTimeoutExecuted
  );
  const rewardsTimeoutExecutedRef = useRef(rewardsTimeoutExecuted);
  const onSetDailyRewardModalShown = useNotiContext(
    (v) => v.actions.onSetDailyRewardModalShown
  );
  const onSetRewardsTimeoutExecuted = useNotiContext(
    (v) => v.actions.onSetRewardsTimeoutExecuted
  );
  const onSetDailyBonusModalShown = useNotiContext(
    (v) => v.actions.onSetDailyBonusModalShown
  );
  const [collectingReward, setCollectingReward] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const userChangedTab = useRef(false);
  const totalRewardedTwinkles = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkles || 0,
    [notiObj, userId]
  );
  const totalRewardedTwinkleCoins = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkleCoins || 0,
    [notiObj, userId]
  );
  const rewards = useMemo(
    () => notiObj[userId]?.rewards || [],
    [notiObj, userId]
  );
  const loadMoreRewards = useMemo(
    () => notiObj[userId]?.loadMoreRewards || false,
    [notiObj, userId]
  );
  const notifications = useMemo(
    () => notiObj[userId]?.notifications || [],
    [userId, notiObj]
  );
  const [activeTab, setActiveTab] = useState(
    notifications?.length > 0 ? 'notifications' : 'rankings'
  );
  const activeTabRef = useRef(activeTab);
  const loadMoreNotifications = useMemo(
    () => notiObj[userId]?.loadMore || false,
    [userId, notiObj]
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const [isDailyBonusButtonShown, setIsDailyBonusButtonShown] = useState(
    !!todayStats.dailyHasBonus &&
      !todayStats.dailyBonusAttempted &&
      todayStats.dailyRewardResultViewed
  );

  useEffect(() => {
    init();
    async function init() {
      const currentNextDayTimeStamp = await getCurrentNextDayTimeStamp();
      if (
        todayStats?.nextDayTimeStamp &&
        todayStats?.nextDayTimeStamp !== currentNextDayTimeStamp
      ) {
        handleCountdownComplete(currentNextDayTimeStamp);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageVisible, todayStats?.nextDayTimeStamp]);

  useEffect(() => {
    setIsDailyBonusButtonShown(
      !!todayStats?.dailyHasBonus &&
        !dailyRewardModalShown &&
        !todayStats?.dailyBonusAttempted &&
        !!todayStats?.dailyRewardResultViewed
    );
  }, [
    dailyRewardModalShown,
    todayStats?.dailyBonusAttempted,
    todayStats?.dailyRewardResultViewed,
    todayStats?.dailyHasBonus
  ]);

  useEffect(() => {
    rewardsTimeoutExecutedRef.current = rewardsTimeoutExecuted;
  }, [rewardsTimeoutExecuted]);

  useEffect(() => {
    if (!userChangedTab.current && userId) {
      const hasRewards = totalRewardedTwinkles + totalRewardedTwinkleCoins > 0;
      const isRewardTabActive = activeTab === 'reward';
      const hasNotifications = notifications.length > 0;
      const isNotificationTabActive = activeTab === 'notification';
      const isHomeWithNotifications = location === 'home' && hasNotifications;
      const hasNewNotifications = numNewNotis > 0;

      let tab = 'rankings';

      if (
        (isRewardTabActive || hasRewards) &&
        (userChangedTab.current || !rewardsTimeoutExecutedRef.current)
      ) {
        tab = 'reward';
      } else if (
        (isNotificationTabActive && hasNotifications) ||
        isHomeWithNotifications ||
        hasNewNotifications
      ) {
        tab = 'notification';
      }

      setActiveTab(tab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    totalRewardedTwinkles,
    totalRewardedTwinkleCoins,
    notifications?.length,
    activeTab,
    location,
    numNewNotis
  ]);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (collectingReward) {
      isRewardCollectedRef.current = true;
    }
  }, [collectingReward]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        activeTabRef.current === 'reward' &&
        !userChangedTab.current &&
        !isRewardCollectedRef.current
      ) {
        setActiveTab('notification');
      }
      onSetRewardsTimeoutExecuted(true);
    }, 5000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    onSetDailyRewardModalShown(false);
    onSetDailyBonusModalShown(false);
    userChangedTab.current = false;
    if (activeTab === 'reward') {
      setActiveTab('notification');
    }
    if (!userId) {
      setActiveTab('rankings');
    }
    handleFetchNotifications(userId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (
      trackScrollPosition &&
      !deviceIsMobile &&
      scrollPositions[`notification-${location}`] &&
      activeTab === 'notification'
    ) {
      setTimeout(() => {
        ContainerRef.current.scrollTop =
          scrollPositions[`notification-${location}`];
      }, 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <ErrorBoundary componentPath="Notification/index">
      <div
        ref={ContainerRef}
        onScroll={handleScroll}
        style={style}
        className={`${container} ${className}`}
      >
        <section
          style={{
            width: '100%',
            marginBottom: '1rem',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {userId && todayStats?.loaded && (
            <TodayStats
              isDailyRewardChecked={!!todayStats?.dailyRewardResultViewed}
              isDailyBonusButtonShown={isDailyBonusButtonShown}
              myAchievementsObj={todayStats?.myAchievementsObj || {}}
              onSetMyAchievementsObj={(myAchievementsObj) => {
                onUpdateTodayStats({
                  newStats: {
                    myAchievementsObj
                  }
                });
              }}
            />
          )}
          <div style={{ position: 'relative' }}>
            {userId && (numNewNotis > 0 || !!(notifications.length > 0)) && (
              <FilterBar
                bordered
                style={{
                  fontSize: '1.6rem',
                  height: '5rem',
                  marginBottom:
                    loadingNotifications && activeTab === 'reward' ? 0 : null
                }}
              >
                <nav
                  className={`${activeTab === 'notification' && 'active'} ${
                    numNewNotis > 0 && 'alert'
                  }`}
                  onClick={() => {
                    userChangedTab.current = true;
                    setActiveTab('notification');
                  }}
                >
                  {newsLabel}
                </nav>
                <nav
                  className={activeTab === 'rankings' ? 'active' : ''}
                  onClick={() => {
                    userChangedTab.current = true;
                    setActiveTab('rankings');
                  }}
                >
                  {rankingsLabel}
                </nav>
                {rewards.length > 0 && (
                  <nav
                    className={`${activeTab === 'reward' ? 'active' : ''} ${
                      totalRewardedTwinkles + totalRewardedTwinkleCoins > 0 &&
                      'super-alert'
                    }`}
                    onClick={() => {
                      userChangedTab.current = true;
                      setActiveTab('reward');
                    }}
                  >
                    Rewards
                  </nav>
                )}
              </FilterBar>
            )}
            <div style={{ position: 'relative' }}>
              <MainFeeds
                collectingReward={collectingReward}
                loadingNotifications={loadingNotifications}
                loadMoreRewardsButton={loadMoreRewards}
                loadMoreNotificationsButton={loadMoreNotifications}
                activeTab={activeTab}
                notifications={notifications}
                onSetCollectingReward={setCollectingReward}
                rewards={rewards}
                selectNotiTab={() => {
                  userChangedTab.current = true;
                  setActiveTab('notification');
                }}
              />
            </div>
            {loadingNotifications && userId && (
              <Loading
                style={{
                  position: 'absolute',
                  height: 0,
                  top: '8.5rem',
                  zIndex: 1000
                }}
              />
            )}
          </div>
        </section>
      </div>
    </ErrorBoundary>
  );

  async function handleCountdownComplete(newNextDayTimeStamp?: number) {
    onSetDailyRewardModalShown(false);
    if (!newNextDayTimeStamp) {
      newNextDayTimeStamp = await getCurrentNextDayTimeStamp();
    }
    onUpdateTodayStats({
      newStats: {
        xpEarned: 0,
        coinsEarned: 0,
        achievedDailyGoals: [],
        dailyHasBonus: false,
        dailyBonusAttempted: false,
        dailyRewardResultViewed: false,
        nextDayTimeStamp: newNextDayTimeStamp
      }
    });
  }

  async function handleFetchNotifications(userId: number) {
    if (notifications.length === 0 && userId) {
      handleFetchNews(userId);
    }
  }

  async function handleFetchNews(userId: number) {
    if (!loadingNotificationRef.current) {
      setLoadingNotifications(true);
      loadingNotificationRef.current = true;
      const [
        { currentChatSubject, loadMoreNotifications, notifications },
        {
          rewards,
          loadMoreRewards,
          totalRewardedTwinkles,
          totalRewardedTwinkleCoins
        }
      ] = await Promise.all([fetchNotifications(), loadRewards()]);
      onLoadRewards({
        rewards,
        loadMoreRewards,
        totalRewardedTwinkles,
        totalRewardedTwinkleCoins,
        userId
      });
      onLoadNotifications({
        currentChatSubject,
        loadMoreNotifications,
        notifications,
        userId
      });
      setLoadingNotifications(false);
      loadingNotificationRef.current = false;
    }
  }

  function handleScroll(event: any) {
    if (!trackScrollPosition || activeTab !== 'notification') return;
    scrollPositions[`notification-${location}`] = event.target.scrollTop;
  }
}

export default memo(Notification);
