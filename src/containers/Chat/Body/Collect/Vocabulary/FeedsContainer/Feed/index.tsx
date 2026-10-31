import React, { memo, useMemo, useRef, useState, useEffect } from 'react';
import SpellLayout from './SpellLayout';
import RewardLayout from './RewardLayout';
import BreakLayout from './BreakLayout';
import moment from 'moment';
import { vocabFeedHeight } from '~/constants/state';
import { useLazyLoad } from '~/helpers/hooks';
import {
  isMeasuredHeight,
  lazyContentShown,
  useLazyStandInReady
} from '~/helpers/lazyPlaceholder';
import { useInView } from 'react-intersection-observer';
import DefaultLayout from './DefaultLayout';
import {
  badgeStyle,
  getActionColor,
  getBreakTypeColor,
  getRGBA
} from '~/components/WordMasterBadges';

function Feed({
  feed,
  eager = false,
  onWordMasterBreak
}: {
  feed: any;
  eager?: boolean;
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
  const PanelRef = useRef<HTMLDivElement>(null);
  const [heightCachedAtMount] = useState(() => vocabFeedHeight[feed.id]);
  const placeholderHeightRef = useRef(heightCachedAtMount);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    heightCachedAtMount
  );
  const [inViewRef, inView, inViewEntry] = useInView({
    rootMargin: '200px 0px'
  });
  const standInReady = useLazyStandInReady(inViewEntry);

  const isVisible = useLazyLoad({
    id: `vocab-feed-${feed.id}`,
    inView,
    PanelRef,
    onSetPlaceholderHeight: (height: number) => {
      if (!isMeasuredHeight(height)) return;
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    },
    delay: 2000
  });

  useEffect(() => {
    return function cleanUp() {
      vocabFeedHeight[feed.id] = placeholderHeightRef.current;
    };
  }, [feed.id]);

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  // The newest cards are what's on screen when Word Master opens; they render
  // in full from the first frame instead of opening from a placeholder on
  // screen (the iPhone drift, same as the 10-04 /users jank). Older cards'
  // empty stand-in is only ever their measured height.
  const feedShown =
    eager ||
    lazyContentShown({
      inView,
      isVisible,
      measuredHeight: placeholderHeight,
      standInReady,
      heightCachedAtMount
    });
  const isBreakFeed = action === 'break_start' || action === 'break_clear';

  return (
    <div ref={inViewRef} style={{ marginBottom: '1.5rem' }}>
      {!feedShown ? (
        <div style={{ width: '100%', height: placeholderHeight }} />
      ) : (
        <div ref={PanelRef}>
          {isBreakFeed ? (
            <BreakLayout
              userId={userId}
              username={username}
              profilePicUrl={profilePicUrl}
              action={action}
              breakIndex={feed.breakIndex}
              breakType={feed.breakType}
              displayedTime={displayedTime}
              getRGBA={getRGBA}
              getActionColor={getActionColor}
              getBreakTypeColor={getBreakTypeColor}
              badgeStyle={badgeStyle}
            />
          ) : action === 'spell' ? (
            <SpellLayout
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
      )}
    </div>
  );
}

export default memo(Feed);
