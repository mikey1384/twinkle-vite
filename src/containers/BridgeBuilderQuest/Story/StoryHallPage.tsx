import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css, keyframes } from '@emotion/css';
import Button from '~/components/Button';
import ErrorBoundary from '~/components/ErrorBoundary';
import HomeLoginPrompt from '~/components/HomeLoginPrompt';
import Icon from '~/components/Icon';
import Loading from '~/components/Loading';
import { useAppContext, useKeyContext } from '~/contexts';
import { Color, mobileMaxWidth } from '~/constants/css';
import { QuestNote } from '../StepCard';
import { StoryCardGrid, StoryCardRow } from './StoryCard';
import { storyBackLink, storyPageShell, storyPageWidth } from './StoryPage';
import { EXAMPLES_PATH, HALL_PATH, QUEST_PATH } from './storyHelpers';
import type { StoryCardData } from './types';

const rise = keyframes`
  from { opacity: 0; transform: translateY(1.2rem); }
  to { opacity: 1; transform: translateY(0); }
`;

// /bridge-builder/stories — the "Bridge Builders" history hall: every live
// story, newest first (signed-in members). /bridge-builder/examples — the
// example stories (anyone, parents included).
export default function StoryHallPage({ mode }: { mode: 'hall' | 'examples' }) {
  const userId = useKeyContext((v) => v.myState.userId);
  const loadMeetupStoryHall = useAppContext((v) => v.requestHelpers.loadMeetupStoryHall);
  const loadMeetupSampleStories = useAppContext(
    (v) => v.requestHelpers.loadMeetupSampleStories
  );
  const trackMeetupQuestView = useAppContext(
    (v) => v.requestHelpers.trackMeetupQuestView
  );
  const [stories, setStories] = useState<StoryCardData[] | null>(null);
  const [samples, setSamples] = useState<StoryCardData[]>([]);
  const [nextBefore, setNextBefore] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const isHall = mode === 'hall';

  useEffect(() => {
    if (!isHall && userId) trackMeetupQuestView('examples_page');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHall, userId]);

  useEffect(() => {
    loadMeetupSampleStories()
      .then((data: { samples: StoryCardData[] }) => setSamples(data.samples || []))
      .catch(() => setSamples([]));
    if (!isHall) return;
    if (!userId) return;
    loadMeetupStoryHall()
      .then((data: { stories: StoryCardData[]; nextBefore: number }) => {
        setStories(data.stories || []);
        setNextBefore(data.nextBefore || 0);
      })
      .catch((err: any) => setError(err?.message || 'Could not load the stories.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHall, userId]);

  return (
    <ErrorBoundary componentPath="BridgeBuilderQuest/Story/StoryHallPage">
      <div className={storyPageShell}>
        <main className={storyPageWidth}>
          <Link to={QUEST_PATH} className={storyBackLink}>
            <Icon icon="arrow-left" /> The meetup quest
          </Link>
          <header
            className={css`
              position: relative;
              overflow: hidden;
              border-radius: 2rem;
              background: ${isHall ? '#2f6fd0' : '#1d2b3a'};
              color: #fff;
              padding: 4rem 4rem 4.4rem;
              animation: ${rise} 0.5s ease-out both;
              @media (max-width: ${mobileMaxWidth}) {
                border-radius: 0;
                padding: 2.8rem 1.8rem 3.2rem;
              }
            `}
          >
            <svg
              aria-hidden
              viewBox="0 0 600 120"
              preserveAspectRatio="none"
              className={css`
                position: absolute;
                right: -2rem;
                bottom: 0;
                width: 60%;
                height: 12rem;
                opacity: 0.22;
              `}
            >
              {[40, 100, 160, 220, 280, 340, 400, 460, 520, 580].map((x) => {
                const t = (x - 300) / 300;
                return <line key={x} x1={x} x2={x} y1={20 + 70 * t * t} y2={108} stroke="#fff" strokeWidth={4} />;
              })}
              <path d="M 0 96 Q 300 -60 600 96" fill="none" stroke="#fff" strokeWidth={6} />
              <line x1={0} x2={600} y1={110} y2={110} stroke="#fff" strokeWidth={8} />
            </svg>
            <div
              className={css`
                font-size: 1.3rem;
                font-weight: 800;
                letter-spacing: 0.14em;
                text-transform: uppercase;
                opacity: 0.85;
              `}
            >
              {isHall ? 'Twinkle history' : 'What a finished meetup looks like'}
            </div>
            <h1
              className={css`
                margin: 0.8rem 0 1rem;
                font-size: 4rem;
                font-weight: 900;
                line-height: 1.1;
                position: relative;
                @media (max-width: ${mobileMaxWidth}) {
                  font-size: 3rem;
                }
              `}
            >
              {isHall ? 'Bridge Builders' : 'Example stories'}
            </h1>
            <p
              className={css`
                margin: 0;
                max-width: 64rem;
                font-size: 1.7rem;
                line-height: 1.6;
                opacity: 0.95;
                position: relative;
              `}
            >
              {isHall
                ? 'Every crew here brought students from different Twinkle branches together in real life, did something amazing and made a page about it.'
                : 'These examples show what your crew can make after a real meetup. The kids are made up and the pictures are AI illustrations. Real stories show your own photos, and only the ones every parent in them said yes to.'}
            </p>
            <div
              className={css`
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
                margin-top: 2.2rem;
                position: relative;
              `}
            >
              <Link to={QUEST_PATH} className={pillLink('#22a35a', '#fff')}>
                <Icon icon="plus" /> Start your own crew
              </Link>
              <Link
                to={isHall ? EXAMPLES_PATH : HALL_PATH}
                className={pillLink('rgba(255,255,255,0.16)', '#fff')}
              >
                <Icon icon={isHall ? 'wand-magic-sparkles' : 'book-open'} />
                {isHall ? 'See example stories' : 'Real Bridge Builders stories'}
              </Link>
            </div>
          </header>

          {!isHall && (
            <section className={sectionClass}>
              {!samples.length ? <Loading /> : <StoryCardGrid stories={samples} columns={2} />}
              <ForParents />
            </section>
          )}

          {isHall && !userId && (
            <section className={sectionClass}>
              <HomeLoginPrompt />
            </section>
          )}

          {isHall && userId && (
            <section className={sectionClass}>
              {error && <QuestNote tone="warning">{error}</QuestNote>}
              {!stories && !error && <Loading />}
              {stories && stories.length === 0 && (
                <div
                  className={css`
                    text-align: center;
                    padding: 3rem 1rem;
                    font-size: 1.7rem;
                    color: ${Color.darkerGray()};
                  `}
                >
                  <Icon icon="star" style={{ color: '#f0b400', fontSize: '3.2rem' }} />
                  <p style={{ margin: '1.2rem 0 0' }}>
                    No stories yet. Yours could be the very first one!
                  </p>
                </div>
              )}
              {stories && stories.length > 0 && <StoryCardGrid stories={stories} />}
              {nextBefore > 0 && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                  <Button variant="soft" color="logoBlue" loading={loadingMore} onClick={loadMore}>
                    Show older stories
                  </Button>
                </div>
              )}
              {samples.length > 0 && (
                <div style={{ marginTop: '3.4rem' }}>
                  <h2 className={rowHeading}>
                    <Icon icon="wand-magic-sparkles" style={{ color: '#2f6fd0' }} /> Example
                    stories
                  </h2>
                  <StoryCardRow stories={samples} />
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </ErrorBoundary>
  );

  async function loadMore() {
    setLoadingMore(true);
    try {
      const data = await loadMeetupStoryHall(nextBefore);
      setStories((current) => [...(current || []), ...(data.stories || [])]);
      setNextBefore(data.nextBefore || 0);
    } finally {
      setLoadingMore(false);
    }
  }
}

function ForParents() {
  return (
    <div
      className={css`
        margin-top: 3rem;
        padding: 2.2rem 2.4rem;
        border-radius: 1.6rem;
        background: ${Color.logoBlue(0.07)};
        border: 1px solid ${Color.logoBlue(0.25)};
        font-size: 1.5rem;
        line-height: 1.65;
        color: #2c3a48;
        h3 {
          margin: 0 0 0.8rem;
          font-size: 1.8rem;
          color: #1d2b3a;
        }
        ul {
          margin: 0;
          padding-left: 2rem;
        }
      `}
    >
      <h3>
        <Icon icon="user-graduate" style={{ marginRight: '0.6rem', color: '#2f6fd0' }} />
        For parents: how a real story is made
      </h3>
      <ul>
        <li>Every meetup needs a grown-up there (a parent or a Twinkle teacher), and Twinkle staff approve the plan first.</li>
        <li>After the meetup, the crew writes the story and chooses photos. Kids appear by username, not by real name, and addresses and exact places are not allowed.</li>
        <li>A photo or clip goes on the page only when the parent of every child in it said yes by email. If we have no parent email for a child, photos of that child stay private. A parent can withdraw later with the same link.</li>
        <li>A Twinkle admin reads every story before it goes live. The video the crew films for the review always stays private.</li>
      </ul>
    </div>
  );
}

const sectionClass = css`
  background: #fff;
  border-radius: 2rem;
  padding: 2.8rem;
  @media (max-width: ${mobileMaxWidth}) {
    border-radius: 0;
    padding: 1.8rem 1.2rem;
  }
`;

const rowHeading = css`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 2rem;
  font-weight: 900;
  color: #1d2b3a;
  margin: 0 0 1.2rem;
`;

function pillLink(background: string, color: string) {
  return css`
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    padding: 1.1rem 2rem;
    border-radius: 999px;
    background: ${background};
    color: ${color};
    font-size: 1.5rem;
    font-weight: 800;
    transition: transform 0.15s;
    &:hover {
      text-decoration: none;
      color: ${color};
      transform: translateY(-2px);
    }
  `;
}
