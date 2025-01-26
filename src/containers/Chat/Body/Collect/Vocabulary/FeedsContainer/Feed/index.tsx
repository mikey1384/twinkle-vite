import React, { useEffect, useMemo, useState, useRef } from 'react';
import SpellLayout from './SpellLayout';
import RewardLayout from './RewardLayout';
import moment from 'moment';
import { css } from '@emotion/css';
import { socket } from '~/constants/sockets/api';
import { vocabFeedHeight } from '~/constants/state';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import DefaultLayout from './DefaultLayout';

export default function Feed({
  feed,
  feed: {
    action,
    content,
    isNewFeed,
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
  },
  isLastFeed,
  myId
}: {
  feed: any;
  isLastFeed: boolean;
  myId: number;
}) {
  const feedRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView({
    rootMargin: '200px 0px',
    triggerOnce: true
  });

  useEffect(() => {
    if (feedRef.current) {
      ref(feedRef.current);
    }
  }, [ref]);

  const previousPlaceholderHeight = useMemo(
    () => vocabFeedHeight[`${feed.id}`],
    [feed.id]
  );
  const [isVisible, setIsVisible] = useState(false);
  const placeholderHeightRef = useRef(previousPlaceholderHeight);
  const [placeholderHeight, setPlaceholderHeight] = useState(
    previousPlaceholderHeight
  );
  useLazyLoad({
    inView,
    PanelRef: feedRef,
    onSetIsVisible: setIsVisible,
    onSetPlaceholderHeight: (height: number) => {
      setPlaceholderHeight(height);
      placeholderHeightRef.current = height;
    }
  });

  const userIsUploader = myId === userId;

  // If it's a new feed, and it's the last one, and I'm the uploader, send activity
  useEffect(() => {
    if (isNewFeed && isLastFeed && userIsUploader) {
      socket.emit('new_vocab_feed', feed);
    }
  }, [isNewFeed, isLastFeed, userIsUploader, feed]);

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  // This decides what layout to show: "spell", "reward", or "default"
  const feedShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const componentHeight = useMemo(
    () => placeholderHeight || '60px',
    [placeholderHeight]
  );

  useEffect(() => {
    return function cleanup() {
      vocabFeedHeight[`${feed.id}`] = placeholderHeightRef.current;
    };
  }, [feed.id]);

  if (!feedShown) {
    // If not yet visible in the viewport, render a placeholder
    return (
      <div style={{ width: '100%', height: componentHeight }} ref={feedRef} />
    );
  }

  if (action === 'spell') {
    return (
      <SpellLayout
        feedRef={feedRef}
        userId={userId}
        username={username}
        profilePicUrl={profilePicUrl}
        action={action}
        wordLevel={wordLevel}
        aiCard={aiCard}
        getWordFontSize={getWordFontSize}
        content={content}
        xpReward={xpReward}
        coinReward={coinReward}
        totalPoints={totalPoints}
        displayedTime={displayedTime}
        getRGBA={getRGBA}
        getActionColor={getActionColor}
        badgeStyle={badgeStyle}
      />
    );
  } else if (action === 'reward') {
    return (
      <RewardLayout
        feedRef={feedRef}
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
      />
    );
  } else {
    return (
      <DefaultLayout
        feedRef={feedRef}
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
        getWordFontSize={getWordFontSize}
      />
    );
  }
}

function getRGBA(colorName: string, opacity = 1) {
  switch (colorName) {
    case 'logoBlue':
      return `rgba(62, 138, 230, ${opacity})`;
    case 'pink':
      return `rgba(255, 179, 230, ${opacity})`;
    case 'orange':
      return `rgba(255, 183, 90, ${opacity})`;
    case 'red':
      return `rgba(255, 87, 87, ${opacity})`;
    case 'gold':
      return `rgba(255, 207, 102, ${opacity})`;
    case 'limeGreen':
      return `rgba(128, 227, 105, ${opacity})`;
    case 'passionFruit':
      return `rgba(255, 134, 174, ${opacity})`;
    case 'premiumRegister':
      return `linear-gradient(135deg, #ffe259 0%, #ffa751 100%)`;
    case 'premiumSpell':
      return `linear-gradient(135deg, rgba(0,196,255,1) 0%, rgba(62,138,230,1) 100%)`;
    case 'premiumReward':
      return `linear-gradient(135deg, #DA70D6 0%, #8A2BE2 100%)`;
    default:
      return `rgba(153, 153, 153, ${opacity})`;
  }
}

function getActionColor(action: string) {
  switch (action) {
    case 'register':
      return 'premiumRegister';
    case 'spell':
      return 'premiumSpell';
    case 'reward':
      return 'premiumReward';
    case 'hit':
      return 'limeGreen';
    case 'apply':
      return 'pink';
    case 'answer':
      return 'red';
    default:
      return 'passionFruit';
  }
}

function getWordFontSize(wordLevel: number) {
  switch (wordLevel) {
    case 5:
      return '1.9rem';
    case 4:
      return '1.8rem';
    case 3:
      return '1.7rem';
    case 2:
      return '1.6rem';
    default:
      return '1.5rem';
  }
}

function badgeStyle(colorName: string, bgOpacity = 0.85) {
  const isGradient =
    colorName === 'premiumRegister' ||
    colorName === 'premiumSpell' ||
    colorName === 'premiumReward';

  const background = isGradient
    ? getRGBA(colorName)
    : getRGBA(colorName, bgOpacity);

  return css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1rem;
    padding: 0.4rem 0.8rem;
    border-radius: 1rem;
    min-width: 80px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);

    ${isGradient
      ? `
      color: #fff;
      background: ${background};
    `
      : `
      background-color: ${background};
      color: #fff;
    `}

    .label {
      margin-left: 0.4rem;
    }
    svg {
      margin-right: 0.3rem;
    }
    &:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
  `;
}
