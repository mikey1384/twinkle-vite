import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { useAppContext, useKeyContext } from '~/contexts';
import { mobileMaxWidth } from '~/constants/css';
import { publicUrl, storyPath } from './storyHelpers';
import type { StoryCardData } from './types';
import CrewCover from '../CrewCover';

// "Your story is live!": the one-time celebration each member of a crew sees
// the next time they visit after Mikey publishes their Bridge Builder story
// (meetup_story_members.revealSeenAt). Mounted once in the app shell.

const fall = keyframes`
  0% { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 1; }
  100% { transform: translate3d(var(--drift), 108vh, 0) rotate(var(--spin)); opacity: 0.9; }
`;
const popIn = keyframes`
  0% { transform: scale(0.7) translateY(3rem); opacity: 0; }
  60% { transform: scale(1.04) translateY(0); opacity: 1; }
  100% { transform: scale(1); }
`;
const shine = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.12) rotate(8deg); }
`;

const CONFETTI_COLORS = ['#418ceb', '#22a35a', '#f0b400', '#ffffff', '#2f6fd0', '#61e265'];

export default function StoryReveal() {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMyMeetupStoryReveals = useAppContext(
    (v) => v.requestHelpers.loadMyMeetupStoryReveals
  );
  const markMeetupStoryRevealSeen = useAppContext(
    (v) => v.requestHelpers.markMeetupStoryRevealSeen
  );
  const navigate = useNavigate();
  const [story, setStory] = useState<StoryCardData | null>(null);

  useEffect(() => {
    if (!userId) {
      setStory(null);
      return;
    }
    let active = true;
    // a moment after the page settles, so it never competes with loading
    const timer = window.setTimeout(() => {
      loadMyMeetupStoryReveals()
        .then((data: { stories: StoryCardData[] }) => {
          if (active && data?.stories?.length) setStory(data.stories[0]);
        })
        .catch(() => {});
    }, 2500);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  if (!story) return null;
  const cover = publicUrl(story.coverKey);
  const pieces = Array.from({ length: 70 }, (_, i) => i);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your story is live"
      className={css`
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(13, 30, 55, 0.78);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        overflow: hidden;
      `}
    >
      {pieces.map((i) => (
        <span
          key={i}
          aria-hidden
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 14) * 0.18}s`,
              animationDuration: `${3.2 + (i % 5) * 0.5}s`,
              width: `${0.6 + (i % 3) * 0.3}rem`,
              height: `${1 + (i % 4) * 0.3}rem`,
              '--drift': `${((i % 7) - 3) * 3}rem`,
              '--spin': `${(i % 2 ? 1 : -1) * (360 + i * 20)}deg`
            } as React.CSSProperties
          }
          className={css`
            position: absolute;
            top: 0;
            border-radius: 0.2rem;
            animation-name: ${fall};
            animation-timing-function: linear;
            animation-iteration-count: 2;
            animation-fill-mode: both;
            @media (prefers-reduced-motion: reduce) {
              display: none;
            }
          `}
        />
      ))}
      <div
        className={css`
          position: relative;
          width: 100%;
          max-width: 52rem;
          background: #fff;
          border-radius: 2.4rem;
          overflow: hidden;
          box-shadow: 0 2rem 6rem rgba(0, 0, 0, 0.35);
          animation: ${popIn} 0.6s cubic-bezier(0.2, 0.9, 0.3, 1.2) both;
          text-align: center;
        `}
      >
        <div
          className={css`
            position: relative;
            height: 22rem;
            background: #1d2b3a;
            @media (max-width: ${mobileMaxWidth}) {
              height: 18rem;
            }
          `}
        >
          {cover ? (
            <img
              src={cover}
              alt=""
              className={css`width: 100%; height: 100%; object-fit: cover; display: block;`}
            />
          ) : (
            <CrewCover cover={story.crewCover} height="100%" rounded="0" />
          )}
          <span
            className={css`
              position: absolute;
              left: 50%;
              bottom: -3.4rem;
              transform: translateX(-50%);
              width: 6.8rem;
              height: 6.8rem;
              border-radius: 50%;
              background: #22a35a;
              color: #fff;
              font-size: 3rem;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 0.5rem solid #fff;
              box-shadow: 0 0.6rem 1.6rem rgba(0, 0, 0, 0.2);
            `}
          >
            <Icon
              icon="star"
              className={css`
                animation: ${shine} 1.6s ease-in-out infinite;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            />
          </span>
        </div>
        <div
          className={css`
            padding: 4.6rem 2.8rem 2.8rem;
            @media (max-width: ${mobileMaxWidth}) {
              padding: 4.4rem 1.8rem 2.2rem;
            }
          `}
        >
          <div
            className={css`
              font-size: 1.3rem;
              font-weight: 800;
              letter-spacing: 0.14em;
              text-transform: uppercase;
              color: #22a35a;
            `}
          >
            Bridge Builders
          </div>
          <h2
            className={css`
              margin: 0.6rem 0 0.8rem;
              font-size: 3.2rem;
              font-weight: 900;
              color: #1d2b3a;
            `}
          >
            Your story is live!
          </h2>
          <p
            className={css`
              margin: 0 0 0.6rem;
              font-size: 1.9rem;
              font-weight: 800;
              color: #2f6fd0;
            `}
          >
            {story.title}
          </p>
          <p
            className={css`
              margin: 0 0 2.2rem;
              font-size: 1.5rem;
              line-height: 1.6;
              color: #4a5866;
            `}
          >
            {story.crewName} is now part of Twinkle&apos;s history. Everyone on
            Twinkle can read what you did together, and it&apos;s on your
            profile for good.
          </p>
          <div
            className={css`
              display: flex;
              flex-direction: column;
              gap: 0.8rem;
            `}
          >
            <button type="button" onClick={() => close(true)} className={primaryButton}>
              <Icon icon="book-open" style={{ marginRight: '0.7rem' }} />
              See our story
            </button>
            <button type="button" onClick={() => close(false)} className={secondaryButton}>
              Later
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );

  function close(open: boolean) {
    const current = story;
    setStory(null);
    if (!current) return;
    markMeetupStoryRevealSeen(current.storyId).catch(() => {});
    if (open) navigate(storyPath(current.storyId));
  }
}

const primaryButton = css`
  border: none;
  border-radius: 999px;
  padding: 1.4rem 2rem;
  background: #22a35a;
  color: #fff;
  font-size: 1.8rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 0.4rem 0 #177a41;
  &:hover {
    transform: translateY(-1px);
  }
`;

const secondaryButton = css`
  border: none;
  background: transparent;
  color: #737373;
  font-size: 1.5rem;
  font-weight: bold;
  padding: 0.8rem;
  cursor: pointer;
`;
