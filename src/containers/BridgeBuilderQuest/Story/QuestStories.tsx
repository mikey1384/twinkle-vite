import React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@emotion/css';
import Icon from '~/components/Icon';
import { Color, mobileMaxWidth } from '~/constants/css';
import { StoryCardRow } from './StoryCard';
import { EXAMPLES_PATH, HALL_PATH, storyPath } from './storyHelpers';
import type { StoriesOverview, StoryCardData } from './types';

// The quest page's story rows: the example stories near the top (Mikey:
// "i cant intuitively find the example pages"), the Bridge Builders hall and
// the admins' approval list.

const rowSection = css`
  margin-top: 2rem;
  border-radius: 1.4rem;
  background: #fff;
  border: 1px solid var(--ui-border);
  padding: 2rem 2rem 1rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    border-left: 0;
    border-right: 0;
    padding: 1.6rem 1rem 0.6rem;
  }
`;

const headRow = css`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.4rem;
`;

const heading = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 0;
  font-size: 1.9rem;
  font-weight: 900;
  color: ${Color.black()};
`;

const seeAll = css`
  font-size: 1.4rem;
  font-weight: bold;
  white-space: nowrap;
`;

export function ExampleStoriesRow({ samples }: { samples: StoryCardData[] }) {
  if (!samples.length) return null;
  return (
    <section className={rowSection} aria-label="Example stories">
      <div className={headRow}>
        <div>
          <h2 className={heading}>
            <Icon icon="wand-magic-sparkles" style={{ color: '#2f6fd0' }} />
            See example stories
          </h2>
          <p
            className={css`
              margin: 0.4rem 0 0;
              font-size: 1.4rem;
              color: ${Color.darkerGray()};
              line-height: 1.5;
            `}
          >
            What a finished meetup looks like: after your meetup, your crew
            makes a page like these. (Examples: the kids are made up and the
            pictures are AI illustrations.)
          </p>
        </div>
        <Link to={EXAMPLES_PATH} className={seeAll}>
          All examples <Icon icon="arrow-right" />
        </Link>
      </div>
      <StoryCardRow stories={samples} />
    </section>
  );
}

export function StoryHallRow({ hall }: { hall: StoryCardData[] }) {
  return (
    <section className={rowSection} aria-label="Bridge Builders stories">
      <div className={headRow}>
        <div>
          <h2 className={heading}>
            <Icon icon="trophy" style={{ color: Color.gold() }} />
            Bridge Builders hall
          </h2>
          <p
            className={css`
              margin: 0.4rem 0 0;
              font-size: 1.4rem;
              color: ${Color.darkerGray()};
            `}
          >
            Real crews who met up and made their story, newest first.
          </p>
        </div>
        <Link to={HALL_PATH} className={seeAll}>
          See the hall <Icon icon="arrow-right" />
        </Link>
      </div>
      {hall.length ? (
        <StoryCardRow stories={hall.slice(0, 8)} />
      ) : (
        <p
          className={css`
            margin: 0 0 1.4rem;
            font-size: 1.5rem;
            color: ${Color.darkGray()};
          `}
        >
          <Icon icon="star" style={{ color: '#f0b400', marginRight: '0.6rem' }} />
          No stories yet. Your crew could be the first!
        </p>
      )}
    </section>
  );
}

export function AdminStoryQueue({ queue }: { queue: StoriesOverview['reviewQueue'] }) {
  if (!queue) return null;
  return (
    <section className={rowSection} style={{ paddingBottom: '2rem' }}>
      <h2 className={heading} style={{ marginBottom: '1rem' }}>
        <Icon icon="clipboard-check" style={{ color: Color.logoBlue() }} />
        Admin: stories waiting for your OK
      </h2>
      {queue.length === 0 ? (
        <p className={css`margin: 0; font-size: 1.4rem; color: ${Color.darkGray()};`}>
          Nothing is waiting right now.
        </p>
      ) : (
        <ul
          className={css`
            list-style: none;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            gap: 0.6rem;
            font-size: 1.4rem;
          `}
        >
          {queue.map((item) => (
            <li key={item.storyId}>
              <Link to={storyPath(item.storyId)} style={{ fontWeight: 'bold' }}>
                {item.title || '(no title)'}
              </Link>{' '}
              · {item.crewName} ({item.people.join(', ')}) · {item.itemsPublic} public /{' '}
              {item.itemsPrivate} private
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// "Not sure what to plan? See examples" in the quest steps.
export function ExamplesHint({ text = 'Not sure what to plan?' }: { text?: string }) {
  return (
    <Link
      to={EXAMPLES_PATH}
      className={css`
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        align-self: flex-start;
        padding: 0.6rem 1.2rem;
        border-radius: 999px;
        background: ${Color.logoBlue(0.1)};
        color: #2f6fd0;
        font-size: 1.35rem;
        font-weight: bold;
        &:hover {
          text-decoration: none;
          background: ${Color.logoBlue(0.18)};
        }
      `}
    >
      <Icon icon="wand-magic-sparkles" />
      {text} See examples
    </Link>
  );
}
