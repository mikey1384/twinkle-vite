import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MainFeeds from './MainFeeds';
import TodayStats from './TodayStats';
import ErrorBoundary from '~/components/ErrorBoundary';
import FilterBar from '~/components/FilterBar';
import DailyRewardModal from './DailyRewardModal';
import DailyBonusModal from './DailyBonusModal';
import Loading from '~/components/Loading';
import { container } from './Styles';
import {
  useAppContext,
  useNotiContext,
  useViewContext,
  useKeyContext
} from '~/contexts';
import { isMobile } from '~/helpers';
import localize from '~/constants/localize';

const deviceIsMobile = isMobile(navigator);
const newsLabel = localize('news');
const rankingsLabel = localize('rankings');

Notification.propTypes = {
  className: PropTypes.string,
  location: PropTypes.string,
  style: PropTypes.object,
  trackScrollPosition: PropTypes.bool
};

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
  const onLoadRewards = useNotiContext((v) => v.actions.onLoadRewards);
  const onClearRewards = useNotiContext((v) => v.actions.onClearRewards);
  const scrollPositions = useViewContext((v) => v.state.scrollPositions);
  const onRecordScrollPosition = useViewContext(
    (v) => v.actions.onRecordScrollPosition
  );

  const loadingNotificationRef = useRef(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [dailyRewardModalShown, setDailyRewardModalShown] = useState(false);
  const [dailyBonusModalShown, setDailyBonusModalShown] = useState(false);
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
  const loadMoreNotifications = useMemo(
    () => notiObj[userId]?.loadMore || false,
    [userId, notiObj]
  );
  const todayStats = useNotiContext((v) => v.state.todayStats);
  const [isDailyRewardChecked, setIsDailyRewardChecked] = useState(
    !!todayStats?.dailyRewardIsChecked
  );
  const [isDailyBonusButtonShown, setIsDailyBonusButtonShown] = useState(
    !!todayStats.hasBonus && !todayStats.bonusAchieved
  );

  useEffect(() => {
    if (todayStats?.dailyRewardIsChecked) {
      setIsDailyRewardChecked(true);
    }
    if (todayStats?.dailyHasBonus && !todayStats?.dailyBonusAchieved) {
      setIsDailyBonusButtonShown(true);
    }
  }, [
    todayStats?.dailyBonusAchieved,
    todayStats?.dailyRewardIsChecked,
    todayStats?.dailyHasBonus
  ]);

  useEffect(() => {
    if (!userChangedTab.current && userId) {
      const tab =
        activeTab === 'reward' ||
        totalRewardedTwinkles + totalRewardedTwinkleCoins > 0
          ? 'reward'
          : (activeTab === 'notification' && notifications.length > 0) ||
            (location === 'home' && notifications.length > 0) ||
            numNewNotis > 0
          ? 'notification'
          : 'rankings';
      setActiveTab(tab);
      if (totalRewardedTwinkles + totalRewardedTwinkleCoins === 0 && userId) {
        onClearRewards(userId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    userId,
    notifications?.length,
    rewards.length,
    activeTab,
    location,
    numNewNotis
  ]);

  useEffect(() => {
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
      scrollPositions?.[`notification-${location}`] &&
      activeTab === 'notification'
    ) {
      setTimeout(() => {
        ContainerRef.current.scrollTop =
          scrollPositions[`notification-${location}`];
      }, 10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const rewardTabShown = useMemo(() => {
    return (
      (!loadingNotifications || activeTab === 'reward') && rewards.length > 0
    );
  }, [activeTab, loadingNotifications, rewards.length]);

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
          {userId && (
            <TodayStats
              loadingNotifications={loadingNotifications}
              isDailyRewardChecked={isDailyRewardChecked}
              isDailyBonusButtonShown={isDailyBonusButtonShown}
              dailyRewardModalShown={dailyRewardModalShown}
              onCollectRewardButtonClick={() => setDailyRewardModalShown(true)}
              onDailyBonusButtonClick={() => setDailyBonusModalShown(true)}
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
                {rewardTabShown && (
                  <nav
                    className={`${activeTab === 'reward' ? 'active' : ''} ${
                      totalRewardedTwinkles + totalRewardedTwinkleCoins > 0 &&
                      'alert'
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
                loadingNotifications={loadingNotifications}
                loadMoreRewardsButton={loadMoreRewards}
                loadMoreNotificationsButton={loadMoreNotifications}
                activeTab={activeTab}
                notifications={notifications}
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
      {dailyRewardModalShown && (
        <DailyRewardModal
          onSetHasBonus={setIsDailyBonusButtonShown}
          onSetIsDailyRewardChecked={setIsDailyRewardChecked}
          onHide={() => setDailyRewardModalShown(false)}
        />
      )}
      {dailyBonusModalShown && (
        <DailyBonusModal onHide={() => setDailyBonusModalShown(false)} />
      )}
    </ErrorBoundary>
  );

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
    onRecordScrollPosition({
      section: `notification-${location}`,
      position: event.target.scrollTop
    });
  }
}

export default memo(Notification);
