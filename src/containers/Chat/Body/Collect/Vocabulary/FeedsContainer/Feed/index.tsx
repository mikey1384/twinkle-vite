import React, {
  memo,
  useEffect,
  useMemo,
  useState,
  useRef,
  startTransition
} from 'react';
import SpellLayout from './SpellLayout';
import RewardLayout from './RewardLayout';
import moment from 'moment';
import { css } from '@emotion/css';
import { vocabFeedHeight } from '~/constants/state';
import { useLazyLoad } from '~/helpers/hooks';
import { useInView } from 'react-intersection-observer';
import DefaultLayout from './DefaultLayout';

function Feed({
  feed,
  feed: {
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
  }
}: {
  feed: any;
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
    onSetIsVisible: (visible: boolean) => {
      startTransition(() => {
        setIsVisible(visible);
      });
    },
    onSetPlaceholderHeight: (height: number) => {
      startTransition(() => {
        setPlaceholderHeight(height);
        placeholderHeightRef.current = height;
      });
    }
  });

  const displayedTime = useMemo(() => {
    return moment.unix(timeStamp).format('lll');
  }, [timeStamp]);

  const feedShown = useMemo(() => inView || isVisible, [inView, isVisible]);
  const componentHeight = useMemo(
    () => placeholderHeight || '60px',
    [placeholderHeight]
  );

  useEffect(() => {
    return function cleanup() {
      startTransition(() => {
        vocabFeedHeight[`${feed.id}`] = placeholderHeightRef.current;
      });
    };
  }, [feed.id]);

  if (!feedShown) {
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
      />
    );
  }
}

function getRGBA(colorName: string, opacity = 1) {
  switch (colorName) {
    case 'logoBlue':
      // Softer, pastel blue that's easier on the eyes
      return `rgba(62, 138, 230, ${opacity})`;
    case 'pink':
      return `rgba(255, 105, 180, ${opacity})`;
    case 'orange':
      return `rgba(255, 140, 0, ${opacity})`;
    case 'red':
      return `rgba(255, 50, 50, ${opacity})`;
    case 'gold':
      return `rgba(255, 207, 52, ${opacity})`;
    case 'limeGreen':
      return `rgba(50, 205, 50, ${opacity})`;
    case 'passionFruit':
      return `rgba(255, 85, 170, ${opacity})`;
    case 'premiumRegister':
      return `linear-gradient(135deg, #ffe259 0%, #ffa751 100%)`;
    case 'premiumSpell':
      return `linear-gradient(135deg, rgba(80,170,200,1) 0%, rgba(80,140,200,1) 100%)`;
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
    font-family: 'Press Start 2P', cursive;
    font-size: 0.8rem;
    padding: 0.5rem 0.8rem;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    min-width: 80px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
    }

    ${isGradient
      ? `
          color: #fff;
          background: ${background};
          background-size: 200% 200%;
          animation: gradientAnimation 4s ease infinite;
        `
      : `
          background-color: ${background};
          color: #fff;
        `}

    @keyframes gradientAnimation {
      0% {
        background-position: 0% 50%;
      }
      50% {
        background-position: 100% 50%;
      }
      100% {
        background-position: 0% 50%;
      }
    }

    .label {
      margin-left: 0.4rem;
    }
    svg {
      margin-right: 0.3rem;
    }
  `;
}

export default memo(Feed);
