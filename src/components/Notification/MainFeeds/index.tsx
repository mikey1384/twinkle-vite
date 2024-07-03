import React, { useEffect, useMemo, useState } from 'react';
import RoundList from '~/components/RoundList';
import Banner from '~/components/Banner';
import GradientButton from '~/components/Buttons/GradientButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Rankings from './Rankings';
import NotiItem from './NotiItem';
import RewardItem from './RewardItem';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import { REWARD_VALUE, SELECTED_LANGUAGE } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import localize from '~/constants/localize';

const tapToCollectRewardsLabel = localize('tapToCollectRewards');
const yourXPLabel = localize('yourXP');
const yourTwinkleCoinsLabel = localize('yourTwinkleCoins');

export default function MainFeeds({
  activeTab,
  collectingReward,
  loadingNotifications,
  loadMoreNotificationsButton,
  loadMoreRewardsButton,
  notifications,
  onSetCollectingReward,
  rewards,
  selectNotiTab,
  style
}: {
  activeTab: string;
  collectingReward: boolean;
  loadingNotifications: boolean;
  loadMoreNotificationsButton: boolean;
  loadMoreRewardsButton: boolean;
  notifications: any[];
  onSetCollectingReward: (v: boolean) => void;
  rewards: any[];
  selectNotiTab: () => void;
  style?: object;
}) {
  const {
    action: { color: actionColor },
    info: { color: infoColor },
    link: { color: linkColor },
    mention: { color: mentionColor },
    mission: { color: missionColor },
    recommendation: { color: recommendationColor },
    reward: { color: rewardColor }
  } = useKeyContext((v) => v.theme);

  const fetchNotifications = useAppContext(
    (v) => v.requestHelpers.fetchNotifications
  );
  const loadMoreNotifications = useAppContext(
    (v) => v.requestHelpers.loadMoreNotifications
  );
  const loadMoreRewards = useAppContext(
    (v) => v.requestHelpers.loadMoreRewards
  );
  const updateUserXP = useAppContext((v) => v.requestHelpers.updateUserXP);
  const collectRewardedCoins = useAppContext(
    (v) => v.requestHelpers.collectRewardedCoins
  );
  const myAllTimeRank = useNotiContext((v) => v.state.myAllTimeRank);
  const { userId, twinkleXP, twinkleCoins } = useKeyContext((v) => v.myState);
  const {
    alert: { color: alertColor },
    success: { color: successColor }
  } = useKeyContext((v) => v.theme);
  const notiObj = useNotiContext((v) => v.state.notiObj);
  const totalRewardedTwinkles = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkles || 0,
    [userId, notiObj]
  );
  const totalRewardedTwinkleCoins = useMemo(
    () => notiObj[userId]?.totalRewardedTwinkleCoins || 0,
    [userId, notiObj]
  );
  const numNewNotis = useNotiContext((v) => v.state.numNewNotis);
  const onCollectRewards = useNotiContext((v) => v.actions.onCollectRewards);
  const onLoadNotifications = useNotiContext(
    (v) => v.actions.onLoadNotifications
  );
  const onLoadMoreNotifications = useNotiContext(
    (v) => v.actions.onLoadMoreNotifications
  );
  const onLoadMoreRewards = useNotiContext((v) => v.actions.onLoadMoreRewards);
  const onSetUserState = useAppContext((v) => v.user.actions.onSetUserState);
  const [loading, setLoading] = useState(false);
  const [loadingNewFeeds, setLoadingNewFeeds] = useState(false);
  const [originalTwinkleXP, setOriginalTwinkleXP] = useState(0);
  const [originalTwinkleCoins, setOriginalTwinkleCoins] = useState(0);
  const [totalTwinkles, setTotalTwinkles] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  useEffect(() => {
    if (totalRewardedTwinkles > 0) {
      setTotalTwinkles(totalRewardedTwinkles);
    }
    if (totalRewardedTwinkleCoins > 0) {
      setTotalCoins(totalRewardedTwinkleCoins);
    }
  }, [totalRewardedTwinkles, totalRewardedTwinkleCoins]);

  const twinkleLabel = useMemo(() => {
    return SELECTED_LANGUAGE === 'kr'
      ? `트윈클 ${totalTwinkles}개`
      : `${totalTwinkles} Twinkle${totalTwinkles > 0 ? 's' : ''}`;
  }, [totalTwinkles]);

  const totalRewardAmount = useMemo(
    () => totalRewardedTwinkles + totalRewardedTwinkleCoins,
    [totalRewardedTwinkleCoins, totalRewardedTwinkles]
  );

  useEffect(() => {
    if (activeTab !== 'reward' && totalRewardAmount === 0) {
      setTotalTwinkles(0);
      setTotalCoins(0);
    }
  }, [activeTab, totalRewardAmount]);

  const NotificationsItems = useMemo(() => {
    return notifications.map((notification) => (
      <NotiItem
        actionColor={actionColor}
        infoColor={infoColor}
        linkColor={linkColor}
        mentionColor={mentionColor}
        missionColor={missionColor}
        recommendationColor={recommendationColor}
        rewardColor={rewardColor}
        userId={userId}
        key={notification.id}
        notification={notification}
      />
    ));
  }, [
    actionColor,
    infoColor,
    linkColor,
    mentionColor,
    missionColor,
    notifications,
    recommendationColor,
    rewardColor,
    userId
  ]);

  const RewardListItems = useMemo(() => {
    return rewards.map((reward) => (
      <RewardItem
        key={reward.id}
        actionColor={actionColor}
        infoColor={infoColor}
        linkColor={linkColor}
        missionColor={missionColor}
        rewardColor={rewardColor}
        reward={reward}
      />
    ));
  }, [actionColor, infoColor, linkColor, missionColor, rewardColor, rewards]);

  return (
    <ErrorBoundary componentPath="Notification/MainFeeds/index" style={style}>
      {numNewNotis > 0 &&
        !(activeTab === 'reward' && totalRewardAmount > 0) && (
          <Banner
            loading={loadingNewFeeds}
            color={alertColor}
            style={{ marginBottom: '1rem' }}
            onClick={handleNewNotiAlertClick}
            spinnerDelay={100}
          >
            Tap to See {numNewNotis} New Notification
            {numNewNotis > 1 ? 's' : ''}
          </Banner>
        )}
      {activeTab === 'reward' &&
        !loadingNotifications &&
        typeof twinkleXP === 'number' && (
          <ErrorBoundary componentPath="Notification/MainFeeds/RewardNotification">
            {totalRewardAmount > 0 ? (
              <GradientButton
                isFlat
                loading={collectingReward || typeof twinkleXP !== 'number'}
                style={{ marginBottom: '1rem', width: '100%' }}
                fontSize="2.2rem"
                mobileFontSize="1.7rem"
                onClick={handleCollectReward}
              >
                <div>
                  <p>{tapToCollectRewardsLabel}</p>
                  {totalTwinkles > 0 && (
                    <p style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>
                      {twinkleLabel} ({totalTwinkles} * {REWARD_VALUE} ={' '}
                      {addCommasToNumber(totalTwinkles * REWARD_VALUE)} XP)
                    </p>
                  )}
                  {totalCoins > 0 && (
                    <p style={{ fontSize: '1.4rem', marginTop: '0.5rem' }}>
                      {addCommasToNumber(totalCoins)} Twinkle Coin
                      {totalCoins > 0 ? 's' : ''}
                    </p>
                  )}
                </div>
              </GradientButton>
            ) : totalTwinkles > 0 || totalCoins > 0 ? (
              <Banner color={successColor} style={{ marginBottom: '1rem' }}>
                {totalTwinkles > 0 ? (
                  <div style={{ fontSize: '1.7rem' }}>
                    <p>
                      {yourXPLabel}: {addCommasToNumber(originalTwinkleXP)} XP{' '}
                      {'=>'}{' '}
                      {addCommasToNumber(
                        originalTwinkleXP + totalTwinkles * REWARD_VALUE
                      )}{' '}
                      XP
                    </p>
                    <p style={{ fontSize: '1.5rem' }}>
                      (+ {addCommasToNumber(totalTwinkles * REWARD_VALUE)} XP)
                    </p>
                  </div>
                ) : null}
                {totalCoins > 0 ? (
                  <div
                    style={{
                      fontSize: '1.7rem',
                      marginTop: totalTwinkles > 0 ? '1rem' : 0
                    }}
                  >
                    <p>
                      {yourTwinkleCoinsLabel}:{' '}
                      {addCommasToNumber(originalTwinkleCoins)} {'=>'}{' '}
                      {addCommasToNumber(originalTwinkleCoins + totalCoins)}
                    </p>
                    <p style={{ fontSize: '1.5rem' }}>
                      (+ {addCommasToNumber(totalCoins)})
                    </p>
                  </div>
                ) : null}
              </Banner>
            ) : null}
          </ErrorBoundary>
        )}
      {activeTab === 'reward' && !!userId && typeof twinkleXP === 'number' && (
        <MyRank myId={userId} rank={myAllTimeRank} twinkleXP={twinkleXP} />
      )}
      {userId && activeTab === 'notification' && notifications.length > 0 && (
        <RoundList style={{ marginTop: 0 }}>{NotificationsItems}</RoundList>
      )}
      {activeTab === 'rankings' && <Rankings loadingFeeds={loadingNewFeeds} />}
      {activeTab === 'reward' && rewards.length > 0 && (
        <RoundList style={{ marginTop: 0 }}>{RewardListItems}</RoundList>
      )}
      {!loadingNotifications &&
        ((activeTab === 'notification' && loadMoreNotificationsButton) ||
          (activeTab === 'reward' && loadMoreRewardsButton)) &&
        !!userId && (
          <LoadMoreButton
            style={{ marginTop: '1rem' }}
            loading={loading}
            filled
            stretch
            onClick={onLoadMore}
          />
        )}
    </ErrorBoundary>
  );

  async function handleCollectReward() {
    try {
      if (typeof twinkleXP === 'number') {
        setOriginalTwinkleXP(twinkleXP);
        setOriginalTwinkleCoins(twinkleCoins);
        onSetCollectingReward(true);
        const coins = await collectRewardedCoins();
        const { xp, rank } = await updateUserXP({ action: 'collect' });
        onSetUserState({
          userId,
          newState: { twinkleXP: xp, twinkleCoins: coins, rank }
        });
        onCollectRewards(userId);
      }
    } catch (error) {
      console.error('Error collecting reward:', error);
    } finally {
      onSetCollectingReward(false);
    }
  }

  async function handleNewNotiAlertClick() {
    try {
      setLoadingNewFeeds(true);
      const { currentChatSubject, loadMoreNotifications, notifications } =
        await fetchNotifications();
      onLoadNotifications({
        currentChatSubject,
        loadMoreNotifications,
        notifications,
        userId
      });
      selectNotiTab();
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNewFeeds(false);
    }
  }

  async function onLoadMore() {
    setLoading(true);
    try {
      if (activeTab === 'notification') {
        const { loadMoreNotifications: loadMore, notifications: notis } =
          await loadMoreNotifications(
            notifications[notifications.length - 1].id
          );
        onLoadMoreNotifications({
          loadMoreNotifications: loadMore,
          notifications: notis,
          userId
        });
      } else {
        const data = await loadMoreRewards(rewards[rewards.length - 1].id);
        onLoadMoreRewards({ data, userId });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
}
