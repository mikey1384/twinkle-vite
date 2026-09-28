import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import ProfilePic from '~/components/ProfilePic';
import { Color, mobileMaxWidth } from '~/constants/css';
import CrewCover from '../CrewCover';
import {
  publicUrl,
  SAMPLE_SHORT_LABEL,
  samplePath,
  storyPath
} from './storyHelpers';
import type { StoryCardData } from './types';

const INK = '#1d2b3a';

// A story's cover card: the history hall, the examples row, profiles and the
// reveal. Example cards always carry the "Example · AI illustrations" label.
export default function StoryCard({
  story,
  size = 'md'
}: {
  story: StoryCardData;
  size?: 'md' | 'lg';
}) {
  const to = story.isSample ? samplePath(story.sampleSlug) : storyPath(story.storyId);
  const cover = publicUrl(story.coverKey);
  return (
    <Link
      to={to}
      className={css`
        display: flex;
        flex-direction: column;
        min-width: 0;
        background: #fff;
        border-radius: 1.6rem;
        overflow: hidden;
        color: ${INK};
        box-shadow: 0 0.3rem 1.2rem rgba(29, 43, 58, 0.1);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        &:hover {
          text-decoration: none;
          color: ${INK};
          transform: translateY(-4px);
          box-shadow: 0 1rem 2.6rem rgba(29, 43, 58, 0.18);
        }
        &:hover img {
          transform: scale(1.05);
        }
        @media (prefers-reduced-motion: reduce) {
          transition: none;
          &:hover,
          &:hover img {
            transform: none;
          }
        }
      `}
    >
      <div
        className={css`
          position: relative;
          aspect-ratio: ${size === 'lg' ? '16 / 9' : '16 / 10'};
          overflow: hidden;
          background: ${Color.extraLightGray()};
        `}
      >
        {cover ? (
          <img
            src={cover}
            alt=""
            loading="lazy"
            className={css`
              width: 100%;
              height: 100%;
              object-fit: cover;
              display: block;
              transition: transform 0.5s ease;
            `}
          />
        ) : (
          <CrewCover cover={story.crewCover} height="100%" rounded="0" />
        )}
        {story.isSample && (
          <span
            className={css`
              position: absolute;
              top: 0.9rem;
              left: 0.9rem;
              display: inline-flex;
              align-items: center;
              gap: 0.5rem;
              padding: 0.4rem 1rem;
              border-radius: 999px;
              background: rgba(255, 255, 255, 0.95);
              color: ${INK};
              font-size: 1.2rem;
              font-weight: 800;
              box-shadow: 0 0.2rem 0.8rem rgba(0, 0, 0, 0.15);
            `}
          >
            <Icon icon="wand-magic-sparkles" style={{ color: '#2f6fd0' }} />
            {SAMPLE_SHORT_LABEL}
          </span>
        )}
        {story.activityKind && (
          <span
            className={css`
              position: absolute;
              bottom: 0.9rem;
              left: 0.9rem;
              max-width: calc(100% - 1.8rem);
              padding: 0.4rem 1rem;
              border-radius: 999px;
              background: rgba(29, 43, 58, 0.78);
              color: #fff;
              font-size: 1.2rem;
              font-weight: bold;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {story.activityKind}
          </span>
        )}
      </div>
      <div
        className={css`
          padding: 1.4rem 1.6rem 1.6rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          flex: 1;
        `}
      >
        <h3
          className={css`
            margin: 0;
            font-size: ${size === 'lg' ? '2.1rem' : '1.75rem'};
            font-weight: 900;
            line-height: 1.25;
            overflow-wrap: anywhere;
            @media (max-width: ${mobileMaxWidth}) {
              font-size: 1.75rem;
            }
          `}
        >
          {story.title || 'Our story'}
        </h3>
        {story.subtitle && (
          <p
            className={css`
              margin: 0;
              font-size: 1.4rem;
              line-height: 1.45;
              color: ${Color.darkerGray()};
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            `}
          >
            {story.subtitle}
          </p>
        )}
        <div
          className={css`
            margin-top: auto;
            padding-top: 0.8rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
          `}
        >
          <Avatars story={story} />
          <span
            className={css`
              font-size: 1.25rem;
              font-weight: bold;
              color: #1b7f45;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            `}
          >
            {story.branches.length} branches
          </span>
        </div>
      </div>
    </Link>
  );
}

function Avatars({ story }: { story: StoryCardData }) {
  const shown = story.people.slice(0, 5);
  return (
    <span
      aria-label={story.people.map((person) => person.username).join(', ')}
      className={css`
        display: inline-flex;
        align-items: center;
      `}
    >
      {shown.map((person, index) => (
        <span
          key={`${person.userId}-${person.username}`}
          className={css`
            margin-left: ${index === 0 ? 0 : '-0.9rem'};
            border: 2px solid #fff;
            border-radius: 50%;
            display: inline-flex;
          `}
        >
          {person.userId ? (
            <ProfilePic
              userId={person.userId}
              profilePicUrl={person.profilePicUrl || undefined}
              style={{ width: '3.2rem' }}
            />
          ) : (
            <span
              className={css`
                width: 3.2rem;
                height: 3.2rem;
                border-radius: 50%;
                background: ${['#418ceb', '#22a35a', '#f08a24', '#139a9a', '#d9577f'][index % 5]};
                color: #fff;
                font-size: 1.3rem;
                font-weight: 900;
                display: inline-flex;
                align-items: center;
                justify-content: center;
              `}
            >
              {person.username.slice(0, 1).toUpperCase()}
            </span>
          )}
        </span>
      ))}
      {story.peopleCount > shown.length && (
        <span
          className={css`
            margin-left: 0.6rem;
            font-size: 1.2rem;
            font-weight: bold;
            color: ${Color.darkGray()};
          `}
        >
          +{story.peopleCount - shown.length}
        </span>
      )}
    </span>
  );
}

export function StoryCardGrid({
  stories,
  columns = 3
}: {
  stories: StoryCardData[];
  columns?: number;
}) {
  return (
    <div
      className={css`
        display: grid;
        grid-template-columns: repeat(${columns}, minmax(0, 1fr));
        gap: 2rem;
        @media (max-width: 1100px) {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (max-width: ${mobileMaxWidth}) {
          grid-template-columns: minmax(0, 1fr);
          gap: 1.6rem;
        }
      `}
    >
      {stories.map((story) => (
        <StoryCard key={`${story.isSample ? 's' : 'r'}-${story.storyId}`} story={story} />
      ))}
    </div>
  );
}

// A sideways-scrolling row of cover cards (the quest page's examples row).
export function StoryCardRow({ stories }: { stories: StoryCardData[] }) {
  return (
    <div
      className={css`
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: minmax(23rem, 1fr);
        gap: 1.6rem;
        overflow-x: auto;
        padding: 0.4rem 0.2rem 1.4rem;
        scroll-snap-type: x mandatory;
        & > * {
          scroll-snap-align: start;
        }
        @media (max-width: ${mobileMaxWidth}) {
          grid-auto-columns: 78%;
        }
      `}
    >
      {stories.map((story) => (
        <StoryCard key={`${story.isSample ? 's' : 'r'}-${story.storyId}`} story={story} />
      ))}
    </div>
  );
}
