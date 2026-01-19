import React, { useEffect, useMemo, useState } from 'react';
import Banner from '~/components/Banner';
import GradientButton from '~/components/Buttons/GradientButton';
import LoadMoreButton from '~/components/Buttons/LoadMoreButton';
import Rankings from './Rankings';
import NotiItem from './NotiItem';
import SectionHeader from './SectionHeader';
import RewardItem from './RewardItem';
import MyRank from '~/components/MyRank';
import ErrorBoundary from '~/components/ErrorBoundary';
import ScopedTheme from '~/theme/ScopedTheme';
import { css } from '@emotion/css';
import { Color } from '~/constants/css';
import { themedCardBase } from '~/theme/themedCard';
import { useThemedCardVars } from '~/theme/useThemedCardVars';
import { REWARD_VALUE } from '~/constants/defaultValues';
import { addCommasToNumber } from '~/helpers/stringHelpers';
import { useAppContext, useKeyContext, useNotiContext } from '~/contexts';
import { useRoleColor } from '~/theme/useRoleColor';

const tapToCollectRewardsLabel = 'Tap to collect all your rewards';
const yourXPLabel = 'Your XP';
const yourTwinkleCoinsLabel = 'Your Twinkle Coins';

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
  const actionRole = useRoleColor('action', { fallback: 'green' });
  const infoRole = useRoleColor('info', { fallback: 'logoBlue' });
  const linkRole = useRoleColor('link', { fallback: 'logoBlue' });
  const mentionRole = useRoleColor('mention', { fallback: 'passionFruit' });
  const missionRole = useRoleColor('mission', { fallback: 'orange' });
  const recommendationRole = useRoleColor('recommendation', {
    fallback: 'logoBlue'
  });
  const rewardRole = useRoleColor('reward', { fallback: 'pinkOrange' });
  const actionColor = actionRole.colorKey;
  const infoColor = infoRole.colorKey;
  const linkColor = linkRole.colorKey;
  const mentionColor = mentionRole.colorKey;
  const missionColor = missionRole.colorKey;
  const recommendationColor = recommendationRole.colorKey;
  const rewardColor = rewardRole.colorKey;

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
  const userId = useKeyContext((v) => v.myState.userId);
  const twinkleXP = useKeyContext((v) => v.myState.twinkleXP);
  const twinkleCoins = useKeyContext((v) => v.myState.twinkleCoins);
  const alertRole = useRoleColor('alert', { fallback: 'gold' });
  const successRole = useRoleColor('success', { fallback: 'green' });
  const alertColor = alertRole.colorKey;
  const successColor = successRole.colorKey;
  const myRewardStats = useNotiContext((v) =>
    userId ? v.state?.notiObj?.[userId] : null
  );
  const totalRewardedTwinkles = myRewardStats?.totalRewardedTwinkles || 0;
  const totalRewardedTwinkleCoins =
    myRewardStats?.totalRewardedTwinkleCoins || 0;
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

  const { accentColor, cardVars, themeName } = useThemedCardVars({
    role: 'sectionPanel'
  });
  const emptyStateVars = useMemo(
    () =>
      ({
        ...cardVars,
        ['--empty-state-accent' as const]: accentColor
      }) as React.CSSProperties,
    [accentColor, cardVars]
  );
  const emptyStateClass = useMemo(
    () =>
      css`
        ${themedCardBase};
        padding: 1.6rem 2rem;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: ${Color.darkerGray()};
        font-size: 1.5rem;
        line-height: 1.6;
        text-align: center;
        gap: 0.8rem;
      `,
    []
  );

  useEffect(() => {
    if (totalRewardedTwinkles > 0) {
      setTotalTwinkles(totalRewardedTwinkles);
    }
    if (totalRewardedTwinkleCoins > 0) {
      setTotalCoins(totalRewardedTwinkleCoins);
    }
  }, [totalRewardedTwinkles, totalRewardedTwinkleCoins]);

  const twinkleLabel = useMemo(() => {
    return `${totalTwinkles} Twinkle${totalTwinkles > 0 ? 's' : ''}`;
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
    // Group notifications by day label (Today, Yesterday, or date)
    const sections: { label: string; items: any[] }[] = [];
    const now = new Date();
    const todayKey = now.toDateString();
    const yesterdayKey = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toDateString();

    const bySection: Record<string, { label: string; items: any[] }> = {};

    for (const n of notifications) {
      const d = new Date(Number(n.timeStamp) * 1000);
      const key = d.toDateString();
      let label = d.toLocaleDateString();
      if (key === todayKey) label = 'Today';
      else if (key === yesterdayKey) label = 'Yesterday';
      if (!bySection[label]) bySection[label] = { label, items: [] };
      bySection[label].items.push(n);
    }

    // Preserve original order of notifications; build sections in insertion order
    for (const label of Object.keys(bySection)) {
      sections.push(bySection[label]);
    }

    return sections.map((section) => (
      <div key={`sec-${section.label}`}>
        <SectionHeader label={section.label} />
        {section.items.map((notification) => (
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
        ))}
      </div>
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

  const RewardSections = useMemo(() => {
    // Group rewards by day label (Today, Yesterday, or date)
    const sections: { label: string; items: any[] }[] = [];
    const now = new Date();
    const todayKey = now.toDateString();
    const yesterdayKey = new Date(
      now.getTime() - 24 * 60 * 60 * 1000
    ).toDateString();

    const bySection: Record<string, { label: string; items: any[] }> = {};

    for (const r of rewards) {
      const d = new Date(Number(r.timeStamp) * 1000);
      const key = d.toDateString();
      let label = d.toLocaleDateString();
      if (key === todayKey) label = 'Today';
      else if (key === yesterdayKey) label = 'Yesterday';
      if (!bySection[label]) bySection[label] = { label, items: [] };
      bySection[label].items.push(r);
    }

    for (const label of Object.keys(bySection)) {
      sections.push(bySection[label]);
    }

    return sections.map((section) => (
      <div key={`reward-sec-${section.label}`}>
        <SectionHeader label={section.label} />
        {section.items.map((reward) => (
          <RewardItem
            key={reward.id}
            actionColor={actionColor}
            infoColor={infoColor}
            linkColor={linkColor}
            missionColor={missionColor}
            rewardColor={rewardColor}
            reward={reward}
          />
        ))}
      </div>
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
        <MyRank
          myId={userId}
          rank={myAllTimeRank}
          twinkleXP={twinkleXP}
          isNotification
        />
      )}
      {userId && activeTab === 'notification' && notifications.length > 0 && (
        <div style={{ marginTop: 0 }}>{NotificationsItems}</div>
      )}
      {userId &&
        activeTab === 'notification' &&
        notifications.length === 0 &&
        !loadingNotifications && (
          <ScopedTheme
            theme={themeName}
            roles={['sectionPanel', 'sectionPanelText']}
            style={emptyStateVars}
          >
            <div className={emptyStateClass}>
              No notifications yet. Interact with others by leaving comments,
              liking posts, or completing missions to receive notifications.
            </div>
          </ScopedTheme>
        )}
      {activeTab === 'rankings' && <Rankings loadingFeeds={loadingNewFeeds} />}
      {activeTab === 'reward' && rewards.length > 0 && (
        <div style={{ marginTop: 0 }}>{RewardSections}</div>
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
    onSetCollectingReward(true);
    try {
      if (typeof twinkleXP === 'number') {
        setOriginalTwinkleXP(twinkleXP);
        setOriginalTwinkleCoins(twinkleCoins);
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
