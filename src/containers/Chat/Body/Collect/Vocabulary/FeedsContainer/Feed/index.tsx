import React, { memo, useMemo, useRef } from 'react';
import SpellLayout from './SpellLayout';
import RewardLayout from './RewardLayout';
import moment from 'moment';
import { vocabFeedHeight } from '~/constants/state';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import DefaultLayout from './DefaultLayout';
import {
  badgeStyle,
  getActionColor,
  getRGBA
} from '~/components/WordMasterBadges';

function Feed({
  feed,
  onWordMasterBreak
}: {
  feed: any;
  onWordMasterBreak?: (status: any) => void;
}) {
  const {
    action,
    content,
    userId,
    username,
    profilePicUrl,
    timeStamp,
    wordLevel = 1,
    xpReward = 0,
    coinReward = 0,
    totalPoints = 0,
    aiCard,
    rewardType
  } = feed;
  const placeholderHeightRef = useRef(vocabFeedHeight[feed.id]);
  const [inViewRef, inView] = useInView({
    rootMargin: '200px 0px'
  });

  const isVisible = useLazyLoad({
    id: `vocab-feed-${feed.id}`,
    inView,
    delay: 2000
  });

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  const feedShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const componentHeight = placeholderHeightRef.current || '60px';

  function handleHeightMeasured(height: number) {
    placeholderHeightRef.current = height;
    vocabFeedHeight[feed.id] = height;
  }

  return (
    <div ref={inViewRef}>
      {!feedShown ? (
        <div style={{ width: '100%', height: componentHeight }} />
      ) : action === 'spell' ? (
        <SpellLayout
          onHeightMeasured={handleHeightMeasured}
          userId={userId}
          username={username}
          profilePicUrl={profilePicUrl}
          action={action}
          wordLevel={wordLevel}
          aiCard={aiCard}
          content={content}
          xpReward={xpReward}
          coinReward={coinReward}
          totalPoints={totalPoints}
          displayedTime={displayedTime}
          getRGBA={getRGBA}
          getActionColor={getActionColor}
          badgeStyle={badgeStyle}
          onWordMasterBreak={onWordMasterBreak}
        />
      ) : action === 'reward' ? (
        <RewardLayout
          onHeightMeasured={handleHeightMeasured}
          userId={userId}
          username={username}
          profilePicUrl={profilePicUrl}
          action={action}
          wordLevel={wordLevel}
          xpReward={xpReward}
          coinReward={coinReward}
          displayedTime={displayedTime}
          aiCard={aiCard}
          content={content}
          getRGBA={getRGBA}
          getActionColor={getActionColor}
          badgeStyle={badgeStyle}
          rewardType={rewardType}
          onWordMasterBreak={onWordMasterBreak}
        />
      ) : (
        <DefaultLayout
          onHeightMeasured={handleHeightMeasured}
          userId={userId}
          username={username}
          profilePicUrl={profilePicUrl}
          action={action}
          content={content}
          wordLevel={wordLevel}
          xpReward={xpReward}
          coinReward={coinReward}
          totalPoints={totalPoints}
          displayedTime={displayedTime}
          getRGBA={getRGBA}
          getActionColor={getActionColor}
          badgeStyle={badgeStyle}
          onWordMasterBreak={onWordMasterBreak}
        />
      )}
    </div>
  );
}

export default memo(Feed);
