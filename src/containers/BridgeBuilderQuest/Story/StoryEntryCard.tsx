import React from 'react';
import { Link } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import Icon from '~/components/Icon';
import { mobileMaxWidth } from '~/constants/css';
import { EXAMPLES_PATH, storyEditorPath } from './storyHelpers';

const bob = keyframes`
  0%, 100% { transform: translateY(0) rotate(-4deg); }
  50% { transform: translateY(-0.4rem) rotate(4deg); }
`;

// On the crew panel once the meetup video is sent: the way into the crew's
// story page (writing can start while the admins review the video).
export default function StoryEntryCard({
  crewId,
  completed
}: {
  crewId: number;
  completed: boolean;
}) {
  return (
    <div
      className={css`
        margin-top: 1.6rem;
        display: flex;
        align-items: center;
        gap: 1.6rem;
        padding: 1.8rem 2rem;
        border-radius: 1.4rem;
        background: #2f6fd0;
        color: #fff;
        @media (max-width: ${mobileMaxWidth}) {
          flex-direction: column;
          align-items: flex-start;
          padding: 1.6rem;
        }
      `}
    >
      <span
        className={css`
          width: 5.6rem;
          height: 5.6rem;
          border-radius: 1.4rem;
          background: #fff;
          color: #2f6fd0;
          font-size: 2.6rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          animation: ${bob} 3s ease-in-out infinite;
          @media (prefers-reduced-motion: reduce) {
            animation: none;
          }
        `}
      >
        <Icon icon="book-open" />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={css`font-size: 1.9rem; font-weight: 900;`}>
          {completed ? 'Make your story page' : 'Start writing your story'}
        </div>
        <div className={css`font-size: 1.4rem; line-height: 1.5; opacity: 0.92; margin-top: 0.3rem;`}>
          {completed
            ? 'Your meetup is approved! Turn it into a page on Twinkle: who came, what you did, your best photos and clips.'
            : 'While the admins watch your video, your crew can start writing the page about your meetup.'}{' '}
          <Link to={EXAMPLES_PATH} className={css`color: #fff; font-weight: bold; text-decoration: underline;`}>
            See examples
          </Link>
        </div>
      </div>
      <Link
        to={storyEditorPath(crewId)}
        className={css`
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 1.1rem 2rem;
          border-radius: 999px;
          background: #22a35a;
          color: #fff;
          font-size: 1.6rem;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 0.3rem 0 #177a41;
          &:hover {
            text-decoration: none;
            color: #fff;
          }
        `}
      >
        <Icon icon="pencil-alt" />
        Open our story
      </Link>
    </div>
  );
}
